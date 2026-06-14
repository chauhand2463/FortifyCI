"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTrivySbom = generateTrivySbom;
exports.extractPackagesFromSbom = extractPackagesFromSbom;
exports.generateSpdxSbom = generateSpdxSbom;
exports.generateCycloneDxSbom = generateCycloneDxSbom;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const env_1 = require("@shared/config/env");
const logger_1 = require("@shared/utils/logger");
const logger = (0, logger_1.getLogger)();
function writeDockerConfig(credentials) {
    if (!credentials || !credentials.username || !credentials.password)
        return null;
    const dockerDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'fortifyci-docker-'));
    const configPath = path_1.default.join(dockerDir, 'config.json');
    const serverAddress = credentials.serverAddress || 'https://index.docker.io/v1/';
    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    const config = { auths: { [serverAddress]: { auth } } };
    fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info({ serverAddress, dockerDir }, 'Docker registry credentials configured for SBOM generation');
    return {
        dockerConfigDir: dockerDir,
        cleanup: () => {
            try {
                fs_1.default.rmSync(dockerDir, { recursive: true, force: true });
            }
            catch { }
        },
    };
}
function generateTrivySbom(imageRef, format = 'cyclonedx', credentials) {
    const env = (0, env_1.getEnv)();
    const credResult = writeDockerConfig(credentials);
    const trivyFormat = format === 'spdx' ? 'spdx-json' : 'cyclonedx';
    const args = [
        'image',
        '--format', trivyFormat,
        '--cache-dir', path_1.default.resolve(env.TRIVY_CACHE_DIR),
        '--timeout', `${Math.floor(env.TRIVY_TIMEOUT / 60000)}m${Math.floor((env.TRIVY_TIMEOUT % 60000) / 1000)}s`,
        '--db-repository', env.TRIVY_DB_REPOSITORY,
        '--java-db-repository', env.TRIVY_JAVA_DB_REPOSITORY,
        imageRef,
    ];
    logger.info({ imageRef, format: trivyFormat }, 'Generating real SBOM with Trivy');
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(env.TRIVY_BIN_PATH, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: env.TRIVY_TIMEOUT + 10000,
            env: credResult
                ? { ...process.env, DOCKER_CONFIG: credResult.dockerConfigDir }
                : process.env,
        });
        const stdoutChunks = [];
        const stderrChunks = [];
        child.stdout?.on('data', (chunk) => {
            stdoutChunks.push(chunk);
        });
        child.stderr?.on('data', (chunk) => {
            stderrChunks.push(chunk);
        });
        child.on('close', (code) => {
            credResult?.cleanup();
            if (code === 0) {
                const stdout = Buffer.concat(stdoutChunks).toString('utf8');
                try {
                    JSON.parse(stdout);
                    resolve(stdout);
                }
                catch {
                    reject(new Error('Trivy SBOM output is not valid JSON'));
                }
            }
            else {
                const stderr = Buffer.concat(stderrChunks).toString('utf8');
                reject(new Error(stderr || `Trivy SBOM generation exited with code ${code}`));
            }
        });
        child.on('error', (err) => {
            credResult?.cleanup();
            if (err.code === 'ENOENT') {
                reject(new Error(`Trivy binary not found at '${env.TRIVY_BIN_PATH}'.`));
            }
            else {
                reject(new Error(`Trivy SBOM generation failed: ${err.message}`));
            }
        });
    });
}
function extractPackagesFromSbom(sbomJson) {
    const packages = [];
    const seen = new Set();
    if (sbomJson.bomFormat === 'CycloneDX') {
        const components = sbomJson.components || [];
        for (const comp of components) {
            if (comp.type === 'container' || comp.type === 'application')
                continue;
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
    }
    else if (sbomJson.spdxVersion) {
        const spdxPackages = sbomJson.packages || [];
        for (const pkg of spdxPackages) {
            if (pkg.SPDXID === 'SPDXRef-DOCUMENT')
                continue;
            const name = pkg.name || '';
            const version = pkg.versionInfo || '';
            const key = `${name}@${version}`;
            if (!seen.has(key)) {
                seen.add(key);
                let purl = null;
                if (pkg.externalRefs) {
                    for (const ref of pkg.externalRefs) {
                        if (ref.referenceType === 'purl') {
                            purl = ref.referenceLocator;
                            break;
                        }
                    }
                }
                packages.push({ name, version, ecosystem: 'spdx', purl });
            }
        }
    }
    return packages;
}
async function generateSpdxSbom(imageId) {
    const { getPrisma } = await import('@shared/database/prisma');
    const prisma = getPrisma();
    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image)
        throw new Error(`Image ${imageId} not found`);
    const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
    const raw = await generateTrivySbom(imageRef, 'spdx', image.registryCredentials);
    const content = JSON.parse(raw);
    const packages = extractPackagesFromSbom(content);
    return {
        content,
        packageCount: packages.length,
        version: content.spdxVersion || 'SPDX-2.3',
    };
}
async function generateCycloneDxSbom(imageId) {
    const { getPrisma } = await import('@shared/database/prisma');
    const prisma = getPrisma();
    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image)
        throw new Error(`Image ${imageId} not found`);
    const imageRef = `${image.registry}/${image.repository}:${image.tag}`;
    const raw = await generateTrivySbom(imageRef, 'cyclonedx', image.registryCredentials);
    const content = JSON.parse(raw);
    const packages = extractPackagesFromSbom(content);
    return {
        content,
        packageCount: packages.length,
        version: content.specVersion || '1.5',
    };
}
//# sourceMappingURL=generator.js.map