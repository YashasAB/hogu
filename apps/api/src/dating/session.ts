
import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SESSION_SECRET = process.env.SESSION_SECRET || 'change_me_for_prod';
const COOKIE_NAME = process.env.DATING_SESSION_COOKIE_NAME || 'dating_sess';
const MAX_AGE_SECONDS = parseInt(process.env.DATING_SESSION_MAX_AGE_SECONDS || '2592000');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Sign a value with HMAC
 */
function sign(value: string): string {
  return createHmac('sha256', SESSION_SECRET)
    .update(value)
    .digest('hex');
}

/**
 * Verify a signed value
 */
function verify(value: string, signature: string): boolean {
  const expectedSignature = sign(value);
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

/**
 * Create a signed session cookie value
 */
export function createSessionCookie(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + (MAX_AGE_SECONDS * 1000) });
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

/**
 * Parse and verify a session cookie
 */
export function parseSessionCookie(cookieValue: string): { userId: string } | null {
  try {
    const [payload, signature] = cookieValue.split('.');
    
    if (!payload || !signature || !verify(payload, signature)) {
      return null;
    }
    
    const data = JSON.parse(payload);
    
    // Check expiration
    if (Date.now() > data.exp) {
      return null;
    }
    
    return { userId: data.userId };
  } catch (error) {
    return null;
  }
}

/**
 * Set session cookie on response
 */
export function setSessionCookie(res: Response, userId: string): void {
  const cookieValue = createSessionCookie(userId);
  
  res.cookie(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    maxAge: MAX_AGE_SECONDS * 1000,
    path: '/'
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    path: '/'
  });
}

/**
 * Middleware to authenticate dating users
 */
export async function authenticateDatingUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookieValue = req.cookies[COOKIE_NAME];
    
    if (!cookieValue) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = parseSessionCookie(cookieValue);
    
    if (!session) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Verify user still exists
    const user = await prisma.datingUser.findUnique({
      where: { id: session.userId },
      select: { id: true, phone_e164: true, name: true }
    });
    
    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    (req as any).datingUser = user;
    next();
  } catch (error) {
    console.error('Dating auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Optional authentication middleware (doesn't fail if not authenticated)
 */
export async function optionalDatingAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const cookieValue = req.cookies[COOKIE_NAME];
    
    if (cookieValue) {
      const session = parseSessionCookie(cookieValue);
      
      if (session) {
        const user = await prisma.datingUser.findUnique({
          where: { id: session.userId },
          select: { id: true, phone_e164: true, name: true }
        });
        
        if (user) {
          (req as any).datingUser = user;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional dating auth error:', error);
    next();
  }
}
