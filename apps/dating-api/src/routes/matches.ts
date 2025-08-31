
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { IntentSchema, BulkAvailabilitySchema } from '../schemas/matches';

const router = express.Router();

// Get all matches for user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId1: req.user!.id },
          { userId2: req.user!.id }
        ]
      },
      include: {
        user1: {
          include: {
            photos: { take: 1, orderBy: { sortOrder: 'asc' } }
          }
        },
        user2: {
          include: {
            photos: { take: 1, orderBy: { sortOrder: 'asc' } }
          }
        },
        intents: true,
        booking: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const grouped = {
      NEW: [] as any[],
      SCHEDULE: [] as any[],
      SCHEDULED: [] as any[]
    };

    matches.forEach(match => {
      const partner = match.userId1 === req.user!.id ? match.user2 : match.user1;
      const myIntent = match.intents.find(i => i.userId === req.user!.id);
      const theirIntent = match.intents.find(i => i.userId !== req.user!.id);

      const matchCard = {
        id: match.id.toString(),
        status: match.status,
        partner: {
          name: partner.name,
          age: Math.floor((Date.now() - partner.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          photo: partner.photos[0]?.url || null
        },
        myIntent: myIntent?.intent || null,
        theirIntent: theirIntent?.intent || null,
        hasBooking: !!match.booking
      };

      if (match.status in grouped) {
        grouped[match.status as keyof typeof grouped].push(matchCard);
      }
    });

    res.json(grouped);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific match details
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const matchId = BigInt(req.params.id);

    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId1: req.user!.id },
          { userId2: req.user!.id }
        ]
      },
      include: {
        user1: {
          include: {
            photos: { orderBy: { sortOrder: 'asc' } },
            cuisines: true,
            interests: true,
            firstDateTypes: true,
            preferredNeighborhoods: true
          }
        },
        user2: {
          include: {
            photos: { orderBy: { sortOrder: 'asc' } },
            cuisines: true,
            interests: true,
            firstDateTypes: true,
            preferredNeighborhoods: true
          }
        },
        intents: true,
        slots: {
          where: { status: 'ACTIVE' }
        },
        booking: true
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const partner = match.userId1 === req.user!.id ? match.user2 : match.user1;
    const myIntent = match.intents.find(i => i.userId === req.user!.id);
    const theirIntent = match.intents.find(i => i.userId !== req.user!.id);
    const myAvailability = match.slots.filter(s => s.userId === req.user!.id);
    const partnerAvailability = match.slots.filter(s => s.userId !== req.user!.id);

    res.json({
      match: {
        id: match.id.toString(),
        status: match.status
      },
      partner: {
        name: partner.name,
        age: Math.floor((Date.now() - partner.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
        gender: partner.gender,
        city: partner.city,
        neighborhood: partner.neighborhood,
        profession: partner.profession,
        preferredDateNeighborhoods: partner.preferredNeighborhoods.map(p => p.prefNeighborhood),
        firstDateTypes: partner.firstDateTypes.map(f => f.type),
        cuisines: partner.cuisines.map(c => c.cuisine),
        interests: partner.interests.map(i => i.tag),
        photos: partner.photos.map(p => p.url)
      },
      myIntent: myIntent?.intent || null,
      theirIntent: theirIntent?.intent || null,
      myAvailability: myAvailability.map(slot => ({
        id: slot.id.toString(),
        date: slot.date.toISOString().split('T')[0],
        start: slot.startTime,
        end: slot.endTime,
        tz: slot.tz
      })),
      partnerAvailabilitySubmitted: partnerAvailability.length > 0,
      booking: match.booking ? {
        venueName: match.booking.venueName,
        venueAddress: match.booking.venueAddress,
        startTs: match.booking.startTs,
        endTs: match.booking.endTs,
        status: match.booking.status,
        paymentStatus: match.booking.paymentStatus
      } : null
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set intent for match
router.post('/:id/intent', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const matchId = BigInt(req.params.id);
    const data = IntentSchema.parse(req.body);

    // Verify user is part of this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId1: req.user!.id },
          { userId2: req.user!.id }
        ]
      },
      include: { intents: true }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Upsert intent
    await prisma.matchIntent.upsert({
      where: {
        matchId_userId: {
          matchId,
          userId: req.user!.id
        }
      },
      update: {
        intent: data.intent,
        note: data.note
      },
      create: {
        matchId,
        userId: req.user!.id,
        intent: data.intent,
        note: data.note
      }
    });

    // Check if both users have YES intent
    const allIntents = await prisma.matchIntent.findMany({
      where: { matchId }
    });

    const user1Intent = allIntents.find(i => i.userId === match.userId1);
    const user2Intent = allIntents.find(i => i.userId === match.userId2);

    let newStatus = match.status;
    if (user1Intent?.intent === 'YES' && user2Intent?.intent === 'YES') {
      newStatus = 'SCHEDULE';
    } else if (user1Intent?.intent === 'NO' || user2Intent?.intent === 'NO') {
      newStatus = 'CANCELLED';
    }

    if (newStatus !== match.status) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: newStatus }
      });
    }

    res.json({ message: 'Intent updated successfully', newStatus });
  } catch (error) {
    console.error('Set intent error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Submit availability
router.post('/:id/availability/bulk', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const matchId = BigInt(req.params.id);
    const data = BulkAvailabilitySchema.parse(req.body);

    // Verify user is part of this match
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { userId1: req.user!.id },
          { userId2: req.user!.id }
        ]
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Delete existing active slots for this user/match
    await prisma.availabilitySlot.updateMany({
      where: {
        matchId,
        userId: req.user!.id,
        status: 'ACTIVE'
      },
      data: { status: 'WITHDRAWN' }
    });

    // Create new slots
    if (data.slots.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: data.slots.map(slot => ({
          matchId,
          userId: req.user!.id,
          date: new Date(slot.date),
          startTime: slot.start,
          endTime: slot.end,
          tz: slot.tz
        }))
      });
    }

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Delete specific availability slot
router.delete('/:id/availability/:slotId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const matchId = BigInt(req.params.id);
    const slotId = BigInt(req.params.slotId);

    await prisma.availabilitySlot.updateMany({
      where: {
        id: slotId,
        matchId,
        userId: req.user!.id
      },
      data: { status: 'WITHDRAWN' }
    });

    res.json({ message: 'Availability slot removed' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(400).json({ error: 'Invalid slot ID' });
  }
});

export default router;
