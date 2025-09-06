
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SESSION_SECRET = process.env.SESSION_SECRET || "change_me_for_prod";
const COOKIE_NAME = process.env.DATING_SESSION_COOKIE_NAME || "dating_sess";
const MAX_AGE_SECONDS = parseInt(process.env.DATING_SESSION_MAX_AGE_SECONDS || "2592000");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function sign(value) {
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("base64url");
  return `${value}.${signature}`;
}

function unsign(signedValue) {
  const lastDot = signedValue.lastIndexOf(".");
  if (lastDot === -1) return null;
  
  const value = signedValue.slice(0, lastDot);
  const signature = signedValue.slice(lastDot + 1);
  
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(value)
    .digest("base64url");
  
  if (signature !== expected) return null;
  return value;
}

function createSessionCookie(userId) {
  const sessionData = JSON.stringify({
    userId,
    createdAt: Date.now()
  });
  return sign(sessionData);
}

function parseSessionCookie(cookieValue) {
  try {
    const unsigned = unsign(cookieValue);
    if (!unsigned) return null;
    
    const sessionData = JSON.parse(unsigned);
    const age = Date.now() - sessionData.createdAt;
    
    if (age > MAX_AGE_SECONDS * 1000) return null;
    
    return sessionData;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, userId) {
  const cookieValue = createSessionCookie(userId);
  res.cookie(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    maxAge: MAX_AGE_SECONDS * 1000,
    path: '/'
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    path: '/'
  });
}

export async function authenticateDatingUser(req, res, next) {
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

    const user = await prisma.datingUser.findUnique({
      where: { id: session.userId },
      select: { id: true, phone_e164: true, name: true }
    });

    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'User not found' });
    }

    req.datingUser = user;
    next();
  } catch (error) {
    console.error('Dating auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

export async function optionalDatingAuth(req, res, next) {
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
          req.datingUser = user;
        }
      }
    }
    next();
  } catch (error) {
    console.error('Optional dating auth error:', error);
    next();
  }
}
