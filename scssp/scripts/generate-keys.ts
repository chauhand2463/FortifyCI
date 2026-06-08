import crypto from 'fs';
import { generateKeyPairSync } from 'crypto';
import path from 'path';
import fs from 'fs';

const keysDir = path.resolve(process.cwd(), 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

console.log('RSA key pair generated successfully');
console.log(`Private key: ${path.join(keysDir, 'private.pem')}`);
console.log(`Public key: ${path.join(keysDir, 'public.pem')}`);
