
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { signupSchema, loginSchema } from './validators';
import { hashPassword, verifyPassword } from '../password';
import { setSessionCookie, clearSessionCookie } from '../session';

const prisma = new PrismaClient();

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with country code, keep it
  if (digits.length > 10 && digits.startsWith('91')) {
    return '+' + digits;
  }
  
  // If it's 10 digits, assume India (+91)
  if (digits.length === 10) {
    return '+91' + digits;
  }
  
  // Default: add + if not present
  return digits.startsWith('+') ? digits : '+' + digits;
}

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const validation = signupSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors
      });
      return;
    }
    
    const { phone, password, name, dob } = validation.data;
    const normalizedPhone = normalizePhone(phone);
    
    // Check if user already exists
    const existingUser = await prisma.datingUser.findUnique({
      where: { phone_e164: normalizedPhone }
    });
    
    if (existingUser) {
      res.status(409).json({ error: 'User with this phone number already exists' });
      return;
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = await prisma.datingUser.create({
      data: {
        phone_e164: normalizedPhone,
        password_hash: passwordHash,
        name,
        dob: new Date(dob)
      },
      select: {
        id: true,
        phone_e164: true,
        name: true,
        created_at: true
      }
    });
    
    // Set session cookie
    setSessionCookie(res, user.id);
    
    res.status(201).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Dating signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors
      });
      return;
    }
    
    const { phone, password } = validation.data;
    const normalizedPhone = normalizePhone(phone);
    
    // Find user
    const user = await prisma.datingUser.findUnique({
      where: { phone_e164: normalizedPhone }
    });
    
    if (!user) {
      res.status(401).json({ error: 'Invalid phone number or password' });
      return;
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid phone number or password' });
      return;
    }
    
    // Set session cookie
    setSessionCookie(res, user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        phone_e164: user.phone_e164,
        name: user.name,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Dating login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    clearSessionCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Dating logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = (req as any).datingUser;
    
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    // Get full user data
    const fullUser = await prisma.datingUser.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        phone_e164: true,
        name: true,
        dob: true,
        profession: true,
        dreams: true,
        five_year_goal: true,
        what_i_want_in_partner: true,
        why_partner_would_like_me: true,
        physical_activity: true,
        date_budget: true,
        instagram_handle: true,
        diet: true,
        drinking: true,
        smoking: true,
        created_at: true,
        updated_at: true
      }
    });
    
    if (!fullUser) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    res.json({
      success: true,
      user: fullUser
    });
  } catch (error) {
    console.error('Dating me error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
}
