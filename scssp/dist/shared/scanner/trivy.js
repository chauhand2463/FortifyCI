"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelScanProcess = cancelScanProcess;
exports.getActiveScanIds = getActiveScanIds;
exports.getActiveScanCount = getActiveScanCount;
exports.scanImage = scanImage;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const env_1 = require("@shared/config/env");
const logger_1 = require("@shared/utils/logger");
const logger = (0, logger_1.getLogger)();
const activeProcesses = new Map();
function writeDockerConfig(credentials) {
    if (!credentials || !credentials.username || !credentials.password)
        return null;
    const dockerDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'fortifyci-docker-'));
    const configPath = path_1.default.join(dockerDir, 'config.json');
    const serverAddress = credentials.serverAddress || 'https://index.docker.io/v1/';
    const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    const config = { auths: { [serverAddress]: { auth } } };
    fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info({ serverAddress, dockerDir }, 'Docker registry credentials configured for scan');
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
function cancelScanProcess(scanId) {
    const entry = activeProcesses.get(scanId);
    if (!entry)
        return false;
    const { process: child, startTime } = entry;
    const runtime = Date.now() - startTime;
    logger.info({ scanId, pid: child.pid, runtime: `${runtime}ms` }, 'Cancelling scan process');
    try {
        if (os_1.default.platform() === 'win32') {
            (0, child_process_1.spawn)('taskkill', ['/PID', String(child.pid), '/F', '/T']);
        }
        else {
            child.kill('SIGTERM');
            setTimeout(() => {
                if (child.exitCode === null) {
                    child.kill('SIGKILL');
                }
            }, 5000);
        }
    }
    catch (err) {
        logger.error({ err, scanId }, 'Failed to kill scan process');
    }
    activeProcesses.delete(scanId);
    return true;
}
function getActiveScanIds() {
    return Array.from(activeProcesses.keys());
}
function getActiveScanCount() {
    return activeProcesses.size;
}
async function scanImage(imageRef, credentials, scanId) {
    const env = (0, env_1.getEnv)();
    const startTime = Date.now();
    const credResult = writeDockerConfig(credentials);
    const cacheDir = path_1.default.resolve(env.TRIVY_CACHE_DIR);
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
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(env.TRIVY_BIN_PATH, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: env.TRIVY_TIMEOUT + 10000,
            env: credResult
                ? { ...process.env, DOCKER_CONFIG: credResult.dockerConfigDir }
                : process.env,
        });
        if (scanId) {
            activeProcesses.set(scanId, { process: child, scanId, startTime: Date.now() });
        }
        const stdoutChunks = [];
        const stderrChunks = [];
        let stdoutBytes = 0;
        child.stdout?.on('data', (chunk) => {
            stdoutBytes += chunk.byteLength;
            if (stdoutBytes < 100 * 1024 * 1024) {
                stdoutChunks.push(chunk);
            }
        });
        child.stderr?.on('data', (chunk) => {
            stderrChunks.push(chunk);
        });
        child.on('close', (code, signal) => {
            if (scanId)
                activeProcesses.delete(scanId);
            credResult?.cleanup();
            if (code === 0) {
                try {
                    const stdout = Buffer.concat(stdoutChunks).toString('utf8');
                    const scanTime = Date.now() - startTime;
                    const parsed = JSON.parse(stdout);
                    const results = parsed.Results || [];
                    const vulnerabilities = [];
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
                }
                catch (err) {
                    reject(new Error(`Failed to parse Trivy output: ${err.message}`));
                }
            }
            else if (signal) {
                reject(new Error(`Scan cancelled (${signal})`));
            }
            else {
                const stderr = Buffer.concat(stderrChunks).toString('utf8');
                const message = stderr || `Trivy exited with code ${code}`;
                if (code === null && child.killed) {
                    reject(new Error('Scan was cancelled'));
                }
                else {
                    reject(new Error(message));
                }
            }
        });
        child.on('error', (err) => {
            if (scanId)
                activeProcesses.delete(scanId);
            credResult?.cleanup();
            if (err.code === 'ENOENT') {
                reject(new Error(`Trivy binary not found at '${env.TRIVY_BIN_PATH}'. Install trivy or set TRIVY_BIN_PATH.`));
            }
            else {
                reject(new Error(`Trivy scan failed: ${err.message}`));
            }
        });
    });
}
//# sourceMappingURL=trivy.js.map