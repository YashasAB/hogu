import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
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

// Health check endpoint
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
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
  username: z.string().min(1),
  password: z.string().min(1),
});

// Restaurant login
router.post('/restaurant-login', async (req, res) => {
  const parse = RestaurantLoginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const { username, password } = parse.data;

  try {
    // Find restaurant auth record
    const restaurantAuth = await prisma.restaurantAuth.findUnique({
      where: { username },
      include: {
        restaurant: true
      }
    });

    if (!restaurantAuth) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, restaurantAuth.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token for restaurant
    const token = jwt.sign({ restaurantId: restaurantAuth.restaurantId }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      restaurantId: restaurantAuth.restaurantId,
      restaurant: {
        id: restaurantAuth.restaurant.id,
        name: restaurantAuth.restaurant.name,
        username: username,
      },
    });
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

    // Fetch user data from database using userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        details: true,
        auth: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.auth?.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      preferredHood: user.details?.preferredHood
    });
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

// Cancel a reservation
router.post('/reservations/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId; // Assuming userId is correctly set by authenticateToken
  const reservationId = req.params.id;

  try {
    // Find the reservation and verify ownership
    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        userId: userId
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found or you do not own it.' });
    }

    // Check if reservation can be cancelled (only PENDING and HELD reservations)
    if (!['PENDING', 'HELD'].includes(reservation.status)) {
      return res.status(400).json({ error: 'Reservation cannot be cancelled. Status must be PENDING or HELD.' });
    }

    // Update reservation status to CANCELLED
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

export default router;