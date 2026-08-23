import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'rastaak_admin';

const USER = process.env.ADMIN_USER || 'hnmodeq';
const PASS = process.env.ADMIN_PASSWORD || '123456xX';
const SECRET = process.env.ADMIN_SECRET || 'rastaak-admin-session';

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex');
}

export function checkCredentials(username: string, password: string): boolean {
  const userOk = username.length === USER.length && timingSafeEqual(Buffer.from(username), Buffer.from(USER));
  const passOk = password.length === PASS.length && timingSafeEqual(Buffer.from(password), Buffer.from(PASS));
  return userOk && passOk;
}

export function makeSessionToken(): string {
  const payload = Buffer.from(JSON.stringify({ u: USER, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig || sign(payload) !== sig) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function cookieFromRequest(req: Request): string | undefined {
  const raw = req.headers.get('cookie') || '';
  const match = raw.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return match?.[1];
}

export function isAdminRequest(req: Request): boolean {
  return readSessionToken(cookieFromRequest(req));
}
