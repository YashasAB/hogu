import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get tonight availability
router.get('/tonight', async (req, res) => {
  try {
    const { party_size } = req.query;
    const partySize = parseInt(party_size as string) || 2;

    const currentTime = new Date();
    const todayDate = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    const tomorrowDate = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow's date

    // Get current time and 24 hours from now
    const currentHour = currentTime.getHours();

    // Get all available slots for today and tomorrow within 24 hours
    const timeSlots = [];

    // Add remaining slots for today
    for (let hour = currentHour; hour < 24; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      timeSlots.push({ date: todayDate, time: timeSlot });
    }

    // Add slots for tomorrow up to the same hour
    for (let hour = 0; hour < currentHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      timeSlots.push({ date: tomorrowDate, time: timeSlot });
    }

    // Get available slots for today and tomorrow within the 24-hour range
    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        OR: timeSlots.map(slot => ({
          date: slot.date,
          time: slot.time,
        })),
        partySize: partySize,
        status: 'AVAILABLE',
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            emoji: true,
            neighborhood: true,
            heroImageUrl: true,
          },
        },
      },
      orderBy: [
        {
          date: 'asc',
        },
        {
          time: 'asc',
        },
      ],
    });

    // Group slots by restaurant
    const restaurantSlots = new Map();

    availableSlots.forEach((slot) => {
      const restaurant = slot.restaurant;
      const key = restaurant.id;

      if (!restaurantSlots.has(key)) {
        restaurantSlots.set(key, {
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            neighborhood: restaurant.neighborhood,
            hero_image_url: restaurant.heroImageUrl,
            emoji: restaurant.emoji,
          },
          slots: [],
        });
      }

      const restaurantData = restaurantSlots.get(key);
      if (restaurantData) {
        restaurantData.slots.push({
          slot_id: slot.id,
          time: formatTime(slot.time),
          party_size: slot.partySize,
        });
      }
    });

    const nowSlots = Array.from(restaurantSlots.values()).slice(0, 6);
    const later = Array.from(restaurantSlots.values()).slice(6, 12);

    res.json({ now: nowSlots, later });
  } catch (error) {
    console.error('Error fetching tonight availability:', error);
    res.status(500).json({ error: 'Failed to fetch tonight availability' });
  }
});

// Get all restaurants with available slots in the next 24 hours
router.get('/available-today', async (req, res) => {
  try {
    const currentTime = new Date();
    const currentDate = currentTime.toISOString().split('T')[0];
    const tomorrowDate = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Get all available slots for today and tomorrow within 24 hours
    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        OR: [
          {
            date: currentDate,
            time: {
              gte: currentTimeString
            },
            status: 'AVAILABLE'
          },
          {
            date: tomorrowDate,
            time: {
              lt: currentTimeString
            },
            status: 'AVAILABLE'
          }
        ]
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            emoji: true,
            neighborhood: true,
            heroImageUrl: true,
          },
        },
      },
      orderBy: [
        {
          date: 'asc',
        },
        {
          time: 'asc',
        },
      ],
    });

    // Group slots by restaurant
    const restaurantMap = new Map();

    availableSlots.forEach((slot) => {
      const restaurant = slot.restaurant;
      const key = restaurant.id;

      if (!restaurantMap.has(key)) {
        restaurantMap.set(key, {
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            neighborhood: restaurant.neighborhood,
            hero_image_url: restaurant.heroImageUrl,
            emoji: restaurant.emoji,
          },
          slots: [],
        });
      }

      const restaurantData = restaurantMap.get(key);
      if (restaurantData) {
        restaurantData.slots.push({
          slot_id: slot.id,
          time: formatTime(slot.time),
          party_size: slot.partySize,
          date: slot.date,
        });
      }
    });

    const restaurants = Array.from(restaurantMap.values());

    res.json({ restaurants });
  } catch (error) {
    console.error('Error fetching available restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch available restaurants' });
  }
});

// Get week availability
router.get('/week', async (req, res) => {
  try {
    const { city, start, days, party_size } = req.query;
    const partySize = parseInt(party_size as string) || 2;
    const startDate = start as string;
    const numDays = parseInt(days as string) || 7;

    const weekDays = [];

    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Get available slots for this date
      const availableSlots = await prisma.timeSlot.findMany({
        where: {
          date: dateStr,
          partySize: partySize,
          status: 'AVAILABLE',
        },
        include: {
          restaurant: true,
        },
        take: 10,
      });

      // Group by restaurant for picks
      const restaurantSlots = new Map();
      availableSlots.forEach((slot) => {
        const restaurant = slot.restaurant;
        const key = restaurant.id;

        if (!restaurantSlots.has(key)) {
          restaurantSlots.set(key, {
            restaurant: {
              id: restaurant.id,
              name: restaurant.name,
              slug: restaurant.slug,
              neighborhood: restaurant.neighborhood,
              hero_image_url: restaurant.heroImageUrl,
            },
            slots: [],
          });
        }

        const restaurantData = restaurantSlots.get(key);
        if (restaurantData) {
          restaurantData.slots.push({
            slot_id: slot.id,
            time: formatTime(slot.time),
            party_size: slot.partySize,
          });
        }
      });

      weekDays.push({
        date: dateStr,
        available_count: availableSlots.length,
        picks: Array.from(restaurantSlots.values()).slice(0, 3),
      });
    }

    res.json({ days: weekDays });
  } catch (error) {
    console.error('Error fetching week availability:', error);
    res.status(500).json({ error: 'Failed to fetch week availability' });
  }
});

// Helper function to format time from 24h to 12h format
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Get restaurants with available slots for today
router.get('/tonight-near-you', async (req, res) => {
  try {
    const { party_size } = req.query;
    const partySize = parseInt(party_size as string) || 2;

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // Get all available slots for today from current time onwards
    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        date: today,
        partySize: partySize,
        status: 'AVAILABLE', // Only show truly available slots
        time: {
          gte: `${currentHour.toString().padStart(2, '0')}:00`,
        },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            emoji: true,
            neighborhood: true,
            heroImageUrl: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: {
        time: 'asc',
      },
    });

    // Get unique restaurants that have available slots
    const restaurantMap = new Map();

    availableSlots.forEach((slot) => {
      const restaurant = slot.restaurant;
      const key = restaurant.id;

      if (!restaurantMap.has(key)) {
        restaurantMap.set(key, {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          emoji: restaurant.emoji,
          neighborhood: restaurant.neighborhood,
          hero_image_url: restaurant.heroImageUrl,
          position: {
            lat: restaurant.latitude,
            lng: restaurant.longitude,
          },
          availableSlots: [],
        });
      }

      const restaurantData = restaurantMap.get(key);
      if (restaurantData) {
        restaurantData.availableSlots.push({
          slot_id: slot.id,
          time: formatTime(slot.time),
          party_size: slot.partySize,
        });
      }
    });

    const restaurants = Array.from(restaurantMap.values());

    res.json({ restaurants });
  } catch (error) {
    console.error('Error fetching tonight near you restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

export default router;