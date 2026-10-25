import {
  createHmac,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24;

export function getConfiguredAdminEmail() {
  return (process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
}

function getTokenSecret() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || /change.?me|your.?jwt|placeholder/i.test(secret)) {
    throw new Error('Set a random JWT_SECRET of at least 32 characters in backend/.env before starting the server.');
  }
  return secret;
}

export function assertTokenSecret() {
  getTokenSecret();
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const [saltHex, keyHex] = storedHash.split(':');
  if (!saltHex || !keyHex || !/^[a-f0-9]{32}$/i.test(saltHex) || !/^[a-f0-9]{128}$/i.test(keyHex)) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + SESSION_LIFETIME_SECONDS
  })).toString('base64url');
  const content = `${header}.${payload}`;
  const signature = createHmac('sha256', getTokenSecret()).update(content).digest('base64url');
  return `${content}.${signature}`;
}

export function verifySessionToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid or expired sign-in session.');
  const content = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', getTokenSecret()).update(content).digest();
  const supplied = Buffer.from(parts[2], 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error('Invalid or expired sign-in session.');
  }
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== 'HS256' || !claims.sub || !Number.isFinite(claims.exp) || claims.exp <= now ||
      !Number.isFinite(claims.iat) || claims.iat > now + 60) {
    throw new Error('Invalid or expired sign-in session.');
  }
  return claims;
}

export async function provisionInitialAdmin(db) {
  const email = getConfiguredAdminEmail();
  const password = process.env.INITIAL_ADMIN_PASSWORD || '';
  if (!email && !password) {
    console.warn('[NO-WAIT Backend] Owner login is disabled until INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are configured.');
    return;
  }
  if (!email || !password) {
    throw new Error('Set both INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to enable owner login.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    throw new Error('INITIAL_ADMIN_EMAIL must be valid and INITIAL_ADMIN_PASSWORD must be at least 12 characters.');
  }
  const passwordHash = await hashPassword(password);
  const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [email]);
  if (existing) {
    await db.run(
      "UPDATE users SET password_hash = ?, role = 'ADMIN', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [passwordHash, existing.id]
    );
    return;
  }
  const id = `admin-${randomUUID()}`;
  await db.run(
    "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, 'Restaurant Administrator', ?, ?, 'ADMIN')",
    [id, email, passwordHash]
  );
}
