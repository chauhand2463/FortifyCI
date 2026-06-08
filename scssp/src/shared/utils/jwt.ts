import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload, type KeyLike } from 'jose';
import { getEnv } from '@shared/config/env';

export interface TokenPayload extends JWTPayload {
  sub: string;
  userId: string;
  role: string;
  permissions: string[];
  type: 'access' | 'refresh';
}

let _privateKey: KeyLike | null = null;
let _publicKey: KeyLike | null = null;

async function getPrivateKey(): Promise<KeyLike> {
  if (!_privateKey) {
    const env = getEnv();
    const keyPath = path.resolve(env.JWT_PRIVATE_KEY_PATH);
    const pem = fs.readFileSync(keyPath, 'utf8');
    _privateKey = await importPKCS8(pem, 'RS256');
  }
  return _privateKey;
}

async function getPublicKey(): Promise<KeyLike> {
  if (!_publicKey) {
    const env = getEnv();
    const keyPath = path.resolve(env.JWT_PUBLIC_KEY_PATH);
    const pem = fs.readFileSync(keyPath, 'utf8');
    _publicKey = await importSPKI(pem, 'RS256');
  }
  return _publicKey;
}

export async function generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  const env = getEnv();
  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(env.JWT_ACCESS_TOKEN_EXPIRY)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(payload['sub'] as string)
    .setJti(crypto.randomUUID())
    .sign(privateKey);
}

export async function generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  const env = getEnv();
  const privateKey = await getPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(env.JWT_REFRESH_TOKEN_EXPIRY)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setSubject(payload['sub'] as string)
    .setJti(crypto.randomUUID())
    .sign(privateKey);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const publicKey = await getPublicKey();
  const env = getEnv();
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  return payload as unknown as TokenPayload;
}
