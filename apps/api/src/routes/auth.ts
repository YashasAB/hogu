import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/register', async (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password, fullName } = parse.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hash, fullName } });
  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
});

router.post('/login', async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName } });
});

export default router;
// Restaurant login endpoint
router.post('/restaurant-login', async (req, res) => {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Find user with restaurant role
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        authProviders: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has restaurant role (STAFF or OWNER)
    const restaurantRole = user.userRoles.find(ur => 
      ur.role.name === 'STAFF' || ur.role.name === 'OWNER'
    );

    if (!restaurantRole || !restaurantRole.restaurantId) {
      return res.status(401).json({ error: 'Not authorized for restaurant access' });
    }

    // Verify password (simplified for demo)
    const authProvider = user.authProviders.find(ap => ap.provider === 'password');
    if (!authProvider || authProvider.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token (simplified for demo)
    const token = `restaurant_${user.id}_${Date.now()}`;

    res.json({ 
      token, 
      userId: user.id,
      restaurantId: restaurantRole.restaurantId,
      role: restaurantRole.role.name
    });
  } catch (error) {
    console.error('Restaurant login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
