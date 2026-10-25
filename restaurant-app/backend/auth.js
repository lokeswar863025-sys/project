import { createPublicKey, verify as verifySignature } from 'node:crypto';

const FIREBASE_KEYS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cachedKeys = null;
let keysExpireAt = 0;

async function getFirebaseKeys() {
  if (cachedKeys && Date.now() < keysExpireAt) return cachedKeys;
  const response = await fetch(FIREBASE_KEYS_URL);
  if (!response.ok) throw new Error('Unable to load Firebase signing keys.');
  const payload = await response.json();
  cachedKeys = new Map(payload.keys.map((key) => [key.kid, key]));
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 3600);
  keysExpireAt = Date.now() + maxAge * 1000;
  return cachedKeys;
}

export async function verifyFirebaseIdToken(token) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Firebase authentication is not configured on the server.');
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid sign-in token.');

  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported sign-in token.');

  const keys = await getFirebaseKeys();
  const jwk = keys.get(header.kid);
  if (!jwk) {
    cachedKeys = null;
    const refreshedKeys = await getFirebaseKeys();
    if (!refreshedKeys.has(header.kid)) throw new Error('Unknown sign-in token key.');
  }
  const signingKey = (cachedKeys || keys).get(header.kid);
  const validSignature = verifySignature(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey({ key: signingKey, format: 'jwk' }),
    Buffer.from(parts[2], 'base64url')
  );
  const now = Math.floor(Date.now() / 1000);
  if (!validSignature || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}` ||
      !claims.sub || typeof claims.sub !== 'string' || claims.sub.length > 128 || claims.exp <= now ||
      !Number.isFinite(claims.exp) || !Number.isFinite(claims.iat) || !Number.isFinite(claims.auth_time) ||
      claims.iat > now + 60 || claims.auth_time > now + 60 || claims.email_verified !== true || !claims.email) {
    throw new Error('Sign-in token is invalid or expired.');
  }
  return claims;
}

export function getConfiguredAdminEmail() {
  return (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
}
