import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken'; // Assuming you have jwt installed
import { PrismaClient } from '@prisma/client'; // Assuming you have prisma installed
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'; // Use environment variable for secret key

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

// User signup
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body);

    const { username, password, name, email, phone, preferredHood } = req.body;

    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.userAuth.findUnique({
      where: { username }
    });

    if (existingUser) {
      console.log('User already exists:', username);
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and auth record in a transaction
    console.log('Creating user in database...');
    const result = await prisma.$transaction(async (tx) => {
      // Create the main user record
      const user = await tx.user.create({
        data: {
          email: email || null,
          phone: phone || null,
          name: name || null,
        }
      });

      // Create auth record
      await tx.userAuth.create({
        data: {
          userId: user.id,
          username,
          passwordHash
        }
      });

      // Create user details if provided
      if (name || phone || email || preferredHood) {
        await tx.userDetail.create({
          data: {
            userId: user.id,
            name: name || null,
            phoneNumber: phone || null,
            email: email || null,
            preferredHood: preferredHood || null
          }
        });
      }

      return user;
    });

    console.log('User created successfully:', result.id);
    res.status(201).json({ 
      message: 'User created successfully', 
      userId: result.id 
    });

  } catch (error) {
    console.error('Signup error details:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { username, password } = parse.data;

  try {
    // Find user by username
    const userAuth = await prisma.userAuth.findUnique({
      where: { username },
      include: {
        user: {
          include: {
            details: true
          }
        }
      }
    });

    if (!userAuth) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, userAuth.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userAuth.user.id,
        username: userAuth.username 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: {
        id: userAuth.user.id,
        username: userAuth.username,
        name: userAuth.user.name,
        email: userAuth.user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// Get current user info
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Get user info from token
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'No user ID in token' });
    }

    // Here you would typically fetch user data from database
    // For now, return mock data
    const user = {
      id: userId,
      name: 'yashas ab', // This would come from your database
      username: 'yashasab', // This would come from your database
      email: 'yashasab.ab@gmail.com' // This would come from your database
    };

    res.json(user);
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending reservations for user
router.get('/reservations/pending', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const pendingReservations = await prisma.reservation.findMany({
      where: { 
        userId: req.user!.userId,
        status: { in: ['PENDING', 'HELD'] },
        slot: {
          OR: [
            { date: { gt: today } }, // Future dates
            { 
              AND: [
                { date: today }, // Today's date
                { time: { gt: currentTime } } // Future time
              ]
            }
          ]
        }
      },
      include: {
        restaurant: {
          select: { name: true, slug: true }
        },
        slot: {
          select: { date: true, time: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pendingReservations);
  } catch (error) {
    console.error('Error fetching pending reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;