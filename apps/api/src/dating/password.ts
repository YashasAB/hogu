
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Hash a password using scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  
  // Combine salt and derived key
  const combined = Buffer.concat([salt, derivedKey]);
  return combined.toString('hex');
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const combined = Buffer.from(hash, 'hex');
    
    if (combined.length !== SALT_LENGTH + KEY_LENGTH) {
      return false;
    }
    
    const salt = combined.subarray(0, SALT_LENGTH);
    const storedKey = combined.subarray(SALT_LENGTH);
    
    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    
    return timingSafeEqual(storedKey, derivedKey);
  } catch (error) {
    return false;
  }
}
