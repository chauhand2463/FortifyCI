import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getEnv } from '@shared/config/env';
import { getLogger } from '@shared/utils/logger';
import type { RegistryCredential } from '@shared/scanner/trivy';

const logger = getLogger();

export interface SbomPackage {
  name: string;
  version: string;
  ecosystem: string;
  purl?: string;
}

function writeDockerConfig(credentials?: RegistryCredential | null): { cleanup: () => void; dockerConfigDir: string } | null {
  if (!credentials || !credentials.username || !credentials.password) return null;

  const dockerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fortifyci-docker-'));
  const configPath = path.join(dockerDir, 'config.json');

  const serverAddress = credentials.serverAddress || 'https://index.docker.io/v1/';
  const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');

  const config = { auths: { [serverAddress]: { auth } } };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  logger.info({ serverAddress, dockerDir }, 'Docker registry credentials configured for SBOM generation');

  return {
    dockerConfigDir: dockerDir,
    cleanup: () => {
      try {
        fs.rmSync(dockerDir, { recursive: true, force: true });
      } catch {}
    },
  };
}

export function generateTrivySbom(
  imageRef: string,
  format: 'cyclonedx' | 'spdx' = 'cyclonedx',
  credentials?: RegistryCredential | null,
): Promise<string> {
  const env = getEnv();
  const credResult = writeDockerConfig(credentials);

  const trivyFormat = format === 'spdx' ? 'spdx-json' : 'cyclonedx';

  const args = [
    'image',
    '--format', trivyFormat,
    '--cache-dir', path.resolve(env.TRIVY_CACHE_DIR),
    '--timeout', `${Math.floor(env.TRIVY_TIMEOUT / 60000)}m${Math.floor((env.TRIVY_TIMEOUT % 60000) / 1000)}s`,
    '--db-repository', env.TRIVY_DB_REPOSITORY,
    '--java-db-repository', env.TRIVY_JAVA_DB_REPOSITORY,
    imageRef,
  ];

  logger.info({ imageRef, format: trivyFormat }, 'Generating real SBOM with Trivy');

  return new Promise<string>((resolve, reject) => {
    const child = spawn(env.TRIVY_BIN_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: env.TRIVY_TIMEOUT + 10000,
      env: credResult
        ? { ...process.env, DOCKER_CONFIG: credResult.dockerConfigDir }
        : process.env,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('close', (code) => {
      credResult?.cleanup();

      if (code === 0) {
        const stdout = Buffer.concat(stdoutChunks).toString('utf8');
        try {
          JSON.parse(stdout);
          resolve(stdout);
        } catch {
          reject(new Error('Trivy SBOM output is not valid JSON'));
        }
      } else {
        const stderr = Buffer.concat(stderrChunks).toString('utf8');
        reject(new Error(stderr || `Trivy SBOM generation exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      credResult?.cleanup();
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error(`Trivy binary not found at '${env.TRIVY_BIN_PATH}'.`));
      } else {
        reject(new Error(`Trivy SBOM generation failed: ${err.message}`));
      }
    });
  });
}

export function extractPackagesFromSbom(sbomJson: any): SbomPackage[] {
  const packages: SbomPackage[] = [];
  const seen = new Set<string>();

  if (sbomJson.bomFormat === 'CycloneDX') {
    const components = sbomJson.components || [];
    for (const comp of components) {
      if (comp.type === 'container' || comp.type === 'application') continue;
      const key = `${comp.name}@${comp.version}`;
      if (!seen.has(key)) {
        seen.add(key);
        packages.push({
          name: comp.name || '',
          version: comp.version || '',
          ecosystem: comp.type || 'library',
          purl: comp.purl || null,
        });
      }
    }
  } else if (sbomJson.spdxVersion) {
    const spdxPackages = sbomJson.packages || [];
    for (const pkg of spdxPackages) {
      if (pkg.SPDXID === 'SPDXRef-DOCUMENT') continue;
      const name = pkg.name || '';
      const version = pkg.versionInfo || '';
      const key = `${name}@${version}`;
      if (!seen.has(key)) {
        seen.add(key);
        let purl: string | null = null;
        if (pkg.externalRefs) {
          for (const ref of pkg.externalRefs) {
            if (ref.referenceType === 'purl') {
              purl = ref.referenceLocator;
              break;
            }
          }
        }
        packages.push({ name, version, ecosystem: 'spdx', purl: purl ?? undefined });
      }
    }
  }

  return packages;
}

export async function generateSpdxSbom(imageId: string): Promise<{
  content: Record<string, unknown>;
  packageCount: number;
  version: string;
}> {
  const { getPrisma } = await import('@shared/database/prisma');
  const prisma = getPrisma();
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) throw new Error(`Image ${imageId} not found`);

  const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
  const raw = await generateTrivySbom(imageRef, 'spdx', image.registryCredentials as any);
  const content = JSON.parse(raw);

  const packages = extractPackagesFromSbom(content);

  return {
    content,
    packageCount: packages.length,
    version: content.spdxVersion || 'SPDX-2.3',
  };
}

export async function generateCycloneDxSbom(imageId: string): Promise<{
  content: Record<string, unknown>;
  packageCount: number;
  version: string;
}> {
  const { getPrisma } = await import('@shared/database/prisma');
  const prisma = getPrisma();
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) throw new Error(`Image ${imageId} not found`);

  const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
  const raw = await generateTrivySbom(imageRef, 'cyclonedx', image.registryCredentials as any);
  const content = JSON.parse(raw);

  const packages = extractPackagesFromSbom(content);

  return {
    content,
    packageCount: packages.length,
    version: content.specVersion || '1.5',
  };
}
