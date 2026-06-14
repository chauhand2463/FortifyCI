export declare class EncryptionService {
    private readonly algorithm;
    private readonly key;
    private readonly ivLength;
    constructor();
    encrypt(plaintext: string): string;
    decrypt(ciphertext: string): string;
}
export declare const encryptionService: EncryptionService;
//# sourceMappingURL=encryption.d.ts.map