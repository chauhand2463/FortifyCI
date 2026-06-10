import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { getEnv } from '@shared/config/env';
import { getLogger } from '@shared/utils/logger';

const execFileAsync = promisify(execFile);
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

let trivyLock = Promise.resolve();

async function withTrivyLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void;
  const prev = trivyLock;
  trivyLock = new Promise<void>((resolve) => { release = resolve; });
  await prev;
  try {
    return await fn();
  } finally {
    release!();
  }
}

export async function scanImage(imageRef: string): Promise<TrivyResult> {
  const env = getEnv();
  const startTime = Date.now();

  return withTrivyLock(async () => {
    const cacheDir = path.resolve(env.TRIVY_CACHE_DIR);

    const args = [
      'image',
      '--format', 'json',
      '--severity', 'CRITICAL,HIGH,MEDIUM,LOW,UNKNOWN',
      '--cache-dir', cacheDir,
      '--timeout', `${env.TRIVY_TIMEOUT}ms`,
      '--db-repository', env.TRIVY_DB_REPOSITORY,
      '--java-db-repository', env.TRIVY_JAVA_DB_REPOSITORY,
      imageRef,
    ];

    logger.info({ imageRef, trivyBin: env.TRIVY_BIN_PATH, cacheDir }, 'Starting Trivy scan');

    try {
      const { stdout, stderr } = await execFileAsync(env.TRIVY_BIN_PATH, args, {
        maxBuffer: 100 * 1024 * 1024,
        timeout: env.TRIVY_TIMEOUT + 10000,
      });

      if (stderr) {
        logger.warn({ imageRef, stderr }, 'Trivy stderr output');
      }

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

      logger.info({ imageRef, vulnCount: vulnerabilities.length, scanTime }, 'Trivy scan completed');
      return { vulnerabilities, scanTime, target: imageRef };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Trivy binary not found at '${env.TRIVY_BIN_PATH}'. Install trivy or set TRIVY_BIN_PATH.`);
      }
      throw new Error(`Trivy scan failed: ${error.message}`);
    }
  });
}
