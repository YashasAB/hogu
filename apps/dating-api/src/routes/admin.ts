
import express from 'express';
import { prisma } from '../index';
import { CreateMatchSchema, CreateBookingSchema, UpdateMatchStatusSchema } from '../schemas/matches';

const router = express.Router();

// TODO: Add admin authentication middleware

// Create new match
router.post('/matches', async (req, res) => {
  try {
    const data = CreateMatchSchema.parse(req.body);

    // Verify both users exist
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({
        where: { id: data.userId1 },
        include: { seekingGenders: true }
      }),
      prisma.user.findUnique({
        where: { id: data.userId2 },
        include: { seekingGenders: true }
      })
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({ error: 'One or both users not found' });
    }

    // Check mutual seeking compatibility
    const user1SeeksUser2 = user1.seekingGenders.some(s => s.seeking === user2.gender);
    const user2SeeksUser1 = user2.seekingGenders.some(s => s.seeking === user1.gender);

    if (!user1SeeksUser2 || !user2SeeksUser1) {
      return res.status(400).json({ error: 'Users are not mutually compatible based on seeking preferences' });
    }

    // Create match
    const match = await prisma.match.create({
      data: {
        userId1: data.userId1,
        userId2: data.userId2
      }
    });

    res.status(201).json({
      id: match.id.toString(),
      userId1: match.userId1.toString(),
      userId2: match.userId2.toString(),
      status: match.status
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Create booking for match
router.post('/matches/:id/booking', async (req, res) => {
  try {
    const matchId = BigInt(req.params.id);
    const data = CreateBookingSchema.parse(req.body);

    const booking = await prisma.booking.create({
      data: {
        matchId,
        venueId: data.venueId,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        startTs: data.startTs ? new Date(data.startTs) : undefined,
        endTs: data.endTs ? new Date(data.endTs) : undefined,
        status: data.status || 'HELD',
        paymentStatus: data.paymentStatus || 'PENDING'
      }
    });

    // If booking is confirmed, update match status
    if (data.status === 'CONFIRMED') {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'SCHEDULED' }
      });
    }

    res.status(201).json({
      id: booking.id.toString(),
      matchId: booking.matchId.toString(),
      venueName: booking.venueName,
      venueAddress: booking.venueAddress,
      startTs: booking.startTs,
      endTs: booking.endTs,
      status: booking.status,
      paymentStatus: booking.paymentStatus
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update match status
router.patch('/matches/:id/status', async (req, res) => {
  try {
    const matchId = BigInt(req.params.id);
    const data = UpdateMatchStatusSchema.parse(req.body);

    const match = await prisma.match.update({
      where: { id: matchId },
      data: { status: data.status }
    });

    res.json({
      id: match.id.toString(),
      status: match.status
    });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Get all matches (admin view)
router.get('/matches', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            photos: { take: 1, orderBy: { sortOrder: 'asc' } }
          }
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            photos: { take: 1, orderBy: { sortOrder: 'asc' } }
          }
        },
        intents: true,
        slots: { where: { status: 'ACTIVE' } },
        booking: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedMatches = matches.map(match => ({
      id: match.id.toString(),
      status: match.status,
      user1: {
        id: match.user1.id.toString(),
        name: match.user1.name,
        email: match.user1.email,
        photo: match.user1.photos[0]?.url || null
      },
      user2: {
        id: match.user2.id.toString(),
        name: match.user2.name,
        email: match.user2.email,
        photo: match.user2.photos[0]?.url || null
      },
      intents: match.intents.map(intent => ({
        userId: intent.userId.toString(),
        intent: intent.intent,
        note: intent.note
      })),
      availabilitySlots: match.slots.length,
      booking: match.booking ? {
        id: match.booking.id.toString(),
        venueName: match.booking.venueName,
        status: match.booking.status,
        paymentStatus: match.booking.paymentStatus
      } : null,
      createdAt: match.createdAt
    }));

    res.json(formattedMatches);
  } catch (error) {
    console.error('Get admin matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
