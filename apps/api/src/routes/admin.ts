import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateRestaurant, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get restaurant profile
router.get('/restaurant', authenticateRestaurant, async (req: AuthenticatedRequest, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: req.restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Update restaurant profile
router.put('/restaurant', authenticateRestaurant, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, neighborhood, instagramUrl, website, heroImageUrl } = req.body;

    const restaurant = await prisma.restaurant.update({
      where: { id: req.restaurantId },
      data: {
        name,
        neighborhood,
        instagramUrl,
        website,
        heroImageUrl,
      },
    });

    res.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Get slots for a date
router.get('/slots', authenticateRestaurant, async (req: AuthenticatedRequest, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const slots = await prisma.timeSlot.findMany({
      where: {
        restaurantId: req.restaurantId,
        date: date as string,
      },
      include: {
        reservations: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        time: 'asc',
      },
    });

    // Transform to match frontend format
    const formattedSlots = slots.map(slot => ({
      id: slot.id,
      date: slot.date,
      time: slot.time,
      capacity: slot.partySize,
      status: slot.status.toLowerCase(),
      bookingId: slot.reservations.length > 0 ? slot.reservations[0].id : null,
    }));

    res.json(formattedSlots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// Get all upcoming bookings for the restaurant (pending/confirmed from today onwards)
router.get('/bookings', authenticateRestaurant, async (req: AuthenticatedRequest, res) => {
  try {
    const restaurantId = req.restaurantId;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    const bookings = await prisma.reservation.findMany({
      where: {
        restaurantId: restaurantId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        slot: {
          date: {
            gte: today
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        slot: {
          select: {
            date: true,
            time: true,
            partySize: true
          }
        }
      },
      orderBy: [
        { slot: { date: 'asc' } },
        { slot: { time: 'asc' } },
      ],
    });

    // Transform to match frontend format
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      slotId: booking.slotId,
      guestName: booking.user.name || 'Unknown',
      phone: booking.user.phone,
      partySize: booking.partySize,
      status: booking.status.toLowerCase(),
      createdAt: booking.createdAt.toISOString(),
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Add multiple slots
router.post('/slots/bulk', authenticateRestaurant, async (req: AuthenticatedRequest, res) => {
  try {
    const { date, start, end, interval, capacity } = req.body;

    // Parse start and end times
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    const slots = [];
    for (let time = startTime; time < endTime; time += interval) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      slots.push({
        restaurantId: req.restaurantId!,
        date,
        time: timeString,
        partySize: capacity,
        status: 'AVAILABLE',
      });
    }

    const createdSlots = await prisma.timeSlot.createMany({
      data: slots,
    });

    res.json({ created: createdSlots.count });
  } catch (error) {
    console.error('Error creating slots:', error);
    res.status(500).json({ error: 'Failed to create slots' });
  }
});

// Update slot status
router.patch('/slots/:id', authenticateRestaurant, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const slot = await prisma.timeSlot.update({
      where: {
        id,
        restaurantId: req.restaurantId,
      },
      data: {
        status: status.toUpperCase(),
      },
    });

    res.json(slot);
  } catch (error) {
    console.error('Error updating slot:', error);
    res.status(500).json({ error: 'Failed to update slot' });
  }
});

// Update booking status
router.patch('/bookings/:id', authenticateRestaurant, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = status.toUpperCase();

    // Start a transaction to update both reservation and timeslot
    const result = await prisma.$transaction(async (prisma) => {
      // Update the reservation status
      const booking = await prisma.reservation.update({
        where: {
          id,
          restaurantId: req.restaurantId,
        },
        data: {
          status: normalizedStatus,
          confirmedAt: normalizedStatus === 'CONFIRMED' ? new Date() : undefined,
        },
        include: {
          slot: true,
        },
      });

      // If the reservation is being confirmed/accepted, mark the timeslot as unavailable
      if (normalizedStatus === 'CONFIRMED') {
        await prisma.timeSlot.update({
          where: {
            id: booking.slotId,
          },
          data: {
            status: 'FULL',
          },
        });
      }
      // If the reservation is being cancelled/rejected, mark the timeslot as available again
      else if (normalizedStatus === 'CANCELLED') {
        await prisma.timeSlot.update({
          where: {
            id: booking.slotId,
          },
          data: {
            status: 'AVAILABLE',
          },
        });
      }

      return booking;
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

export default router;