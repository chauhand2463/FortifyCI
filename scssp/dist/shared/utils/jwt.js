"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyToken = verifyToken;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jose_1 = require("jose");
const env_1 = require("@shared/config/env");
let _privateKey = null;
let _publicKey = null;
async function getPrivateKey() {
    if (!_privateKey) {
        const env = (0, env_1.getEnv)();
        const keyPath = path_1.default.resolve(env.JWT_PRIVATE_KEY_PATH);
        const pem = fs_1.default.readFileSync(keyPath, 'utf8');
        _privateKey = await (0, jose_1.importPKCS8)(pem, 'RS256');
    }
    return _privateKey;
}
async function getPublicKey() {
    if (!_publicKey) {
        const env = (0, env_1.getEnv)();
        const keyPath = path_1.default.resolve(env.JWT_PUBLIC_KEY_PATH);
        const pem = fs_1.default.readFileSync(keyPath, 'utf8');
        _publicKey = await (0, jose_1.importSPKI)(pem, 'RS256');
    }
    return _publicKey;
}
async function generateAccessToken(payload) {
    const env = (0, env_1.getEnv)();
    const privateKey = await getPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    return new jose_1.SignJWT({ ...payload, type: 'access' })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt(now)
        .setExpirationTime(env.JWT_ACCESS_TOKEN_EXPIRY)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setSubject(payload['sub'])
        .setJti(crypto_1.default.randomUUID())
        .sign(privateKey);
}
async function generateRefreshToken(payload) {
    const env = (0, env_1.getEnv)();
    const privateKey = await getPrivateKey();
    const now = Math.floor(Date.now() / 1000);
    return new jose_1.SignJWT({ ...payload, type: 'refresh' })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt(now)
        .setExpirationTime(env.JWT_REFRESH_TOKEN_EXPIRY)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setSubject(payload['sub'])
        .setJti(crypto_1.default.randomUUID())
        .sign(privateKey);
}
async function verifyToken(token) {
    const publicKey = await getPublicKey();
    const env = (0, env_1.getEnv)();
    const { payload } = await (0, jose_1.jwtVerify)(token, publicKey, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
    });
    return payload;
}
//# sourceMappingURL=jwt.js.map