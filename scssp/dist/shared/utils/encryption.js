"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionService = exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("@shared/config/env");
class EncryptionService {
    algorithm = 'aes-256-gcm';
    key;
    ivLength;
    constructor() {
        const env = (0, env_1.getEnv)();
        this.key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
        this.ivLength = env.ENCRYPTION_IV_LENGTH;
    }
    encrypt(plaintext) {
        const iv = crypto_1.default.randomBytes(this.ivLength);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }
    decrypt(ciphertext) {
        const parts = ciphertext.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts.slice(2).join(':');
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.EncryptionService = EncryptionService;
exports.encryptionService = new EncryptionService();
//# sourceMappingURL=encryption.js.map