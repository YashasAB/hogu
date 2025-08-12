
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get tonight availability
router.get('/tonight', async (req, res) => {
  try {
    const { city, party_size } = req.query;
    const partySize = parseInt(party_size as string) || 2;
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    // Get available slots for today from current time onwards
    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        date: today,
        partySize: partySize,
        status: 'AVAILABLE',
        time: {
          gte: `${currentHour.toString().padStart(2, '0')}:00`,
        },
      },
      include: {
        restaurant: true,
      },
      orderBy: {
        time: 'asc',
      },
      take: 20, // Limit results
    });

    // Group slots by restaurant
    const restaurantSlots = new Map();
    
    availableSlots.forEach(slot => {
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
      
      restaurantSlots.get(key).slots.push({
        slot_id: slot.id,
        time: formatTime(slot.time),
        party_size: slot.partySize,
      });
    });

    const now = Array.from(restaurantSlots.values()).slice(0, 6);
    const later = Array.from(restaurantSlots.values()).slice(6, 12);

    res.json({ now, later });
  } catch (error) {
    console.error('Error fetching tonight availability:', error);
    res.status(500).json({ error: 'Failed to fetch tonight availability' });
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
      availableSlots.forEach(slot => {
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
        
        restaurantSlots.get(key).slots.push({
          slot_id: slot.id,
          time: formatTime(slot.time),
          party_size: slot.partySize,
        });
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

export default router;
