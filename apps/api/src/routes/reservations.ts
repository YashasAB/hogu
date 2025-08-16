import { Router } from 'express';
import { z } from 'zod';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware - using global interface from index.ts
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Mock availability data
const mockAvailability = [
  { id: '1', time: '18:00', partySize: 2, available: true },
  { id: '2', time: '18:30', partySize: 2, available: true },
  { id: '3', time: '19:00', partySize: 2, available: false },
  { id: '4', time: '19:30', partySize: 2, available: true },
  { id: '5', time: '20:00', partySize: 2, available: true },
  { id: '6', time: '20:30', partySize: 2, available: true }
];

router.get('/availability', async (req, res) => {
  const { restaurantId, date, partySize } = req.query;

  // Mock response
  res.json({
    restaurantId,
    date,
    partySize: parseInt(partySize as string),
    slots: mockAvailability
  });
});

const HoldSchema = z.object({
  slotId: z.string(),
  partySize: z.number().min(1).max(10)
});

router.post('/hold', async (req, res) => {
  const parse = HoldSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { slotId, partySize } = parse.data;

  // Mock hold response
  res.json({
    id: 'mock-reservation-id',
    slotId,
    partySize,
    status: 'HELD',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  });
});

router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;

  // Mock confirmation
  res.json({
    id,
    status: 'CONFIRMED',
    confirmedAt: new Date().toISOString()
  });
});

// Get user's reservations
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log('Today date for filtering:', today);

    const reservations = await prisma.reservation.findMany({
      where: { 
        userId,
        slot: {
          date: {
            gte: today // Get reservations from today onwards
          }
        }
      },
      include: {
        restaurant: {
          select: {
            name: true,
            slug: true,
            emoji: true
          }
        },
        slot: {
          select: {
            date: true,
            time: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${reservations.length} future reservations for user ${userId}`);
    console.log('Reservations:', reservations.map(r => ({ 
      id: r.id, 
      status: r.status, 
      date: r.slot.date, 
      time: r.slot.time,
      restaurant: r.restaurant.name 
    })));

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a reservation
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { restaurantSlug, date, time, partySize } = req.body;

    if (!restaurantSlug || !date || !time || !partySize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the restaurant by slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    console.log(`Creating reservation for restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

    // Convert time to 24-hour format if it's in 12-hour format
    let normalizedTime = time;
    if (time.includes('AM') || time.includes('PM')) {
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const period = timeMatch[3].toUpperCase();

        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }

        normalizedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    }

    // Create or find the time slot using the correct restaurant ID
    const slot = await prisma.timeSlot.upsert({
      where: {
        restaurantId_date_time_partySize: {
          restaurantId: restaurant.id, // Use the found restaurant's ID
          date,
          time: normalizedTime,
          partySize: parseInt(partySize)
        }
      },
      update: {},
      create: {
        restaurantId: restaurant.id, // Use the found restaurant's ID
        date,
        time: normalizedTime,
        partySize: parseInt(partySize),
        status: 'AVAILABLE'
      }
    });

    console.log(`Created/found slot: ${slot.id} for restaurant: ${restaurant.id}`);

    // Create the reservation with the correct restaurant ID and update slot status
    const reservation = await prisma.$transaction(async (tx) => {
      // Update the time slot status to REQUESTED
      await tx.timeSlot.update({
        where: { id: slot.id },
        data: { status: 'REQUESTED' }
      });

      // Create the reservation
      return await tx.reservation.create({
        data: {
          userId,
          restaurantId: restaurant.id, // Explicitly use the found restaurant's ID
          slotId: slot.id,
          partySize: parseInt(partySize),
          status: 'PENDING'
        },
        include: {
          restaurant: {
            select: {
              name: true,
              slug: true,
              emoji: true
            }
          },
          slot: {
            select: {
              date: true,
              time: true
            }
          }
        }
      });
    });

    console.log(`Created reservation: ${reservation.id} for restaurant: ${reservation.restaurantId}`);

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific reservation
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const reservationId = req.params.id;

    const reservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        userId
      },
      include: {
        restaurant: {
          select: {
            name: true,
            slug: true,
            emoji: true
          }
        },
        slot: {
          select: {
            date: true,
            time: true
          }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a reservation
router.post('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const reservationId = req.params.id;

    // Find the reservation first to ensure it belongs to the user
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        id: reservationId,
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] } // Only allow cancelling pending or confirmed reservations
      }
    });

    if (!existingReservation) {
      return res.status(404).json({ error: 'Reservation not found or cannot be cancelled' });
    }

    // Cancel the reservation and update slot status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the reservation status to CANCELLED
      const cancelledReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'CANCELLED' },
        include: {
          restaurant: {
            select: {
              name: true,
              slug: true,
              emoji: true
            }
          },
          slot: {
            select: {
              date: true,
              time: true
            }
          }
        }
      });

      // Update the time slot status back to AVAILABLE
      await tx.timeSlot.update({
        where: { id: existingReservation.slotId },
        data: { status: 'AVAILABLE' }
      });

      return cancelledReservation;
    });

    console.log(`Cancelled reservation: ${reservationId} by user: ${userId}`);
    res.json(result);
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's live reservation status
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    const [pending, ongoing, completed] = await Promise.all([
      prisma.reservation.count({
        where: {
          userId: userId,
          status: { in: ['PENDING', 'HELD'] }
        }
      }),
      prisma.reservation.count({
        where: {
          userId: userId,
          status: 'CONFIRMED'
        }
      }),
      prisma.reservation.count({
        where: {
          userId: userId,
          status: { in: ['SEATED', 'COMPLETED'] }
        }
      })
    ]);

    res.json({
      pending,
      ongoing,
      completed
    });
  } catch (error) {
    console.error('Get live status error:', error);
    res.status(500).json({ error: 'Failed to get live status' });
  }
});

export default router;