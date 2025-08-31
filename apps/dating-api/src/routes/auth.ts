
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { SignupSchema, LoginSchema, RefreshSchema } from '../schemas/auth';

const router = express.Router();

// Store refresh tokens (in production, use Redis)
const refreshTokens: Set<string> = new Set();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const data = SignupSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        tz: data.tz,
        dob: new Date(data.dob),
        gender: data.gender,
        seekingGenders: {
          create: data.interestedIn.map(gender => ({
            seeking: gender as any
          }))
        }
      }
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id.toString(), email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    refreshTokens.add(refreshToken);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const data = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id.toString(), email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    refreshTokens.add(refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const data = RefreshSchema.parse(req.body);

    if (!refreshTokens.has(data.refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const decoded = jwt.verify(data.refreshToken, process.env.JWT_SECRET!) as { userId: string };

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

export default router;
