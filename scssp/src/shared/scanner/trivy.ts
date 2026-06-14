import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getEnv } from '@shared/config/env';
import { getLogger } from '@shared/utils/logger';

const logger = getLogger();

export interface TrivyResult {
  vulnerabilities: TrivyVulnerability[];
  scanTime: number;
  target: string;
}

export interface TrivyVulnerability {
  vulnerabilityId: string;
  pkgName: string;
  installedVersion: string;
  fixedVersion: string | null;
  severity: string;
  title: string | null;
  description: string | null;
  publishedDate: string | null;
  lastModifiedDate: string | null;
  cvssScore: number | null;
  cvssVector: string | null;
  cweIds: string[] | null;
  referenceUrls: string[] | null;
  exploitAvailable: boolean | null;
  epssScore: number | null;
  layerInfo: Record<string, unknown> | null;
  pkgType: string | null;
}

export interface RegistryCredential {
  username: string;
  password: string;
  serverAddress?: string;
}

interface ActiveProcess {
  process: ChildProcess;
  scanId: string;
  startTime: number;
}

const activeProcesses = new Map<string, ActiveProcess>();

function writeDockerConfig(credentials?: RegistryCredential | null): { cleanup: () => void; dockerConfigDir: string } | null {
  if (!credentials || !credentials.username || !credentials.password) return null;

  const dockerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fortifyci-docker-'));
  const configPath = path.join(dockerDir, 'config.json');

  const serverAddress = credentials.serverAddress || 'https://index.docker.io/v1/';
  const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');

  const config = { auths: { [serverAddress]: { auth } } };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  logger.info({ serverAddress, dockerDir }, 'Docker registry credentials configured for scan');

  return {
    dockerConfigDir: dockerDir,
    cleanup: () => {
      try {
        fs.rmSync(dockerDir, { recursive: true, force: true });
      } catch {}
    },
  };
}

export function cancelScanProcess(scanId: string): boolean {
  const entry = activeProcesses.get(scanId);
  if (!entry) return false;

  const { process: child, startTime } = entry;
  const runtime = Date.now() - startTime;
  logger.info({ scanId, pid: child.pid, runtime: `${runtime}ms` }, 'Cancelling scan process');

  try {
    if (os.platform() === 'win32') {
      spawn('taskkill', ['/PID', String(child.pid), '/F', '/T']);
    } else {
      child.kill('SIGTERM');
      setTimeout(() => {
        if (child.exitCode === null) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }
  } catch (err) {
    logger.error({ err, scanId }, 'Failed to kill scan process');
  }

  activeProcesses.delete(scanId);
  return true;
}

export function getActiveScanIds(): string[] {
  return Array.from(activeProcesses.keys());
}

export function getActiveScanCount(): number {
  return activeProcesses.size;
}

export async function scanImage(
  imageRef: string,
  credentials?: RegistryCredential | null,
  scanId?: string,
): Promise<TrivyResult> {
  const env = getEnv();
  const startTime = Date.now();
  const credResult = writeDockerConfig(credentials);

  const cacheDir = path.resolve(env.TRIVY_CACHE_DIR);

  const args = [
    'image',
    '--format', 'json',
    '--severity', 'CRITICAL,HIGH,MEDIUM,LOW,UNKNOWN',
    '--cache-dir', cacheDir,
    '--timeout', `${Math.floor(env.TRIVY_TIMEOUT / 60000)}m${Math.floor((env.TRIVY_TIMEOUT % 60000) / 1000)}s`,
    '--db-repository', env.TRIVY_DB_REPOSITORY,
    '--java-db-repository', env.TRIVY_JAVA_DB_REPOSITORY,
    imageRef,
  ];

  logger.info({ imageRef, trivyBin: env.TRIVY_BIN_PATH, cacheDir }, 'Starting Trivy scan');

  return new Promise<TrivyResult>((resolve, reject) => {
    const child = spawn(env.TRIVY_BIN_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: env.TRIVY_TIMEOUT + 10000,
      env: credResult
        ? { ...process.env, DOCKER_CONFIG: credResult.dockerConfigDir }
        : process.env,
    });

    if (scanId) {
      activeProcesses.set(scanId, { process: child, scanId, startTime: Date.now() });
    }

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let stdoutBytes = 0;

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBytes += chunk.byteLength;
      if (stdoutBytes < 100 * 1024 * 1024) {
        stdoutChunks.push(chunk);
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('close', (code, signal) => {
      if (scanId) activeProcesses.delete(scanId);
      credResult?.cleanup();

      if (code === 0) {
        try {
          const stdout = Buffer.concat(stdoutChunks).toString('utf8');
          const scanTime = Date.now() - startTime;
          const parsed = JSON.parse(stdout);
          const results = parsed.Results || [];
          const vulnerabilities: TrivyVulnerability[] = [];

          for (const result of results) {
            const vulns = result.Vulnerabilities || [];
            for (const v of vulns) {
              vulnerabilities.push({
                vulnerabilityId: v.VulnerabilityID || '',
                pkgName: v.PkgName || '',
                installedVersion: v.InstalledVersion || '',
                fixedVersion: v.FixedVersion || null,
                severity: v.Severity || 'UNKNOWN',
                title: v.Title || null,
                description: v.Description || null,
                publishedDate: v.PublishedDate || null,
                lastModifiedDate: v.LastModifiedDate || null,
                cvssScore: v.CVSS?.nvd?.V3Score || v.CVSS?.redhat?.V3Score || null,
                cvssVector: v.CVSS?.nvd?.V3Vector || null,
                cweIds: v.CweIDs || null,
                referenceUrls: v.References || null,
                exploitAvailable: v.Exploit !== undefined,
                epssScore: v.EPSS?.Score || null,
                layerInfo: v.Layer ? { digest: v.Layer.Digest } : null,
                pkgType: result.Type || null,
              });
            }
          }

          if (stderrChunks.length > 0) {
            logger.warn({ imageRef, stderr: Buffer.concat(stderrChunks).toString('utf8') }, 'Trivy stderr');
          }

          logger.info({ imageRef, vulnCount: vulnerabilities.length, scanTime }, 'Trivy scan completed');
          resolve({ vulnerabilities, scanTime, target: imageRef });
        } catch (err: any) {
          reject(new Error(`Failed to parse Trivy output: ${err.message}`));
        }
      } else if (signal) {
        reject(new Error(`Scan cancelled (${signal})`));
      } else {
        const stderr = Buffer.concat(stderrChunks).toString('utf8');
        const message = stderr || `Trivy exited with code ${code}`;
        if (code === null && child.killed) {
          reject(new Error('Scan was cancelled'));
        } else {
          reject(new Error(message));
        }
      }
    });

    child.on('error', (err) => {
      if (scanId) activeProcesses.delete(scanId);
      credResult?.cleanup();
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error(`Trivy binary not found at '${env.TRIVY_BIN_PATH}'. Install trivy or set TRIVY_BIN_PATH.`));
      } else {
        reject(new Error(`Trivy scan failed: ${err.message}`));
      }
    });
  });
}
