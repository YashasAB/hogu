import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken'; // Assuming you have jwt installed
import { PrismaClient } from '@prisma/client'; // Assuming you have prisma installed

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // Use environment variable for secret key

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

  const { email, fullName } = parse.data;

  // Mock response without database
  const user = { id: '1', email, fullName };
  const token = 'mock-jwt-token';

  res.json({ token, user });
});

router.post('/login', async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { email } = parse.data;

  // Mock response without database
  const user = { id: '1', email, fullName: 'Demo User' };
  const token = 'mock-jwt-token';

  res.json({ token, user });
});

const RestaurantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Restaurant login
router.post('/restaurant-login', async (req, res) => {
  const parse = RestaurantLoginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const { email, password } = parse.data;

  try {
    // For demo purposes, we'll use hardcoded credentials
    // In production, you'd store these in the database with proper hashing
    if (email === 'demo-restaurant@hogu.com' && password === 'restaurant123') {
      // Find a demo restaurant or create one
      let restaurant = await prisma.restaurant.findFirst({
        where: { name: 'Demo Restaurant' }
      });

      if (!restaurant) {
        restaurant = await prisma.restaurant.create({
          data: {
            name: 'Demo Restaurant',
            slug: 'demo-restaurant',
            emoji: '🏪',
            latitude: 12.971599,
            longitude: 77.594566,
            neighborhood: 'Bangalore',
            category: 'fine-dining',
            isHot: true,
          },
        });
      }

      const token = jwt.sign({ restaurantId: restaurant.id }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        token,
        restaurantId: restaurant.id,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          email: email,
        },
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Restaurant login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;