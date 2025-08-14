import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all restaurants
router.get('/', async (_req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        cuisineTags: {
          include: {
            cuisineTag: true,
          },
        },
      },
    });

    const formattedRestaurants = restaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      emoji: restaurant.emoji,
      position: {
        lat: restaurant.latitude,
        lng: restaurant.longitude,
      },
      neighborhood: restaurant.neighborhood,
      category: restaurant.category,
      hot: restaurant.isHot,
      image: restaurant.heroImageUrl || '/api/placeholder/200/150',
      heroImageUrl: restaurant.heroImageUrl,
      instagramUrl: restaurant.instagramUrl,
      website: restaurant.website,
      cuisineTags: restaurant.cuisineTags.map(ct => ct.cuisineTag.name),
    }));

    res.json(formattedRestaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get restaurant by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Fetching restaurant with slug:', slug);

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      include: {
        cuisineTags: {
          include: {
            cuisineTag: true,
          },
        },
      },
    });

    console.log('Found restaurant:', restaurant ? restaurant.name : 'null');

    if (!restaurant) {
      console.log('Restaurant not found for slug:', slug);
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const formattedRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      emoji: restaurant.emoji,
      position: {
        lat: restaurant.latitude,
        lng: restaurant.longitude,
      },
      neighborhood: restaurant.neighborhood,
      category: restaurant.category,
      hot: restaurant.isHot,
      image: restaurant.heroImageUrl || '/api/placeholder/200/150',
      heroImageUrl: restaurant.heroImageUrl,
      instagramUrl: restaurant.instagramUrl,
      website: restaurant.website,
      cuisineTags: restaurant.cuisineTags.map(ct => ct.cuisineTag.name),
    };

    res.json(formattedRestaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Get availability for a restaurant
router.get('/:slug/availability', async (req, res) => {
  try {
    const { slug } = req.params;
    const { date, partySize } = req.query;

    if (!date || !partySize) {
      return res.status(400).json({ error: 'Date and party size are required' });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const slots = await prisma.timeSlot.findMany({
      where: {
        restaurantId: restaurant.id,
        date: date as string,
        partySize: parseInt(partySize as string),
      },
      orderBy: {
        time: 'asc',
      },
    });

    const formattedSlots = slots.map(slot => ({
      id: slot.id,
      time: formatTime(slot.time),
      available: slot.status === 'AVAILABLE',
    }));

    res.json(formattedSlots);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Helper function to format time from 24h to 12h format for display only
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return `${hour12}:${minutes} ${period}`;
}

export default router;