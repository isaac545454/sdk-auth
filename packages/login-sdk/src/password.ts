import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const KEY_LEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } satisfies ScryptOptions;

/** Grava `scrypt$<salt>$<hash>`. A senha em texto puro não entra no banco. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LEN, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (typeof stored !== 'string') return false;

  const [scheme, saltPart, hashPart] = stored.split('$');
  if (scheme !== 'scrypt' || !saltPart || !hashPart) return false;

  const salt = Buffer.from(saltPart, 'base64url');
  const expected = Buffer.from(hashPart, 'base64url');
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await scrypt(password, salt, expected.length, SCRYPT_OPTIONS);
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}
