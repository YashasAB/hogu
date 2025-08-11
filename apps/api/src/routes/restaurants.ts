
import { Router } from 'express';

const router = Router();

// Mock restaurant data
const mockRestaurants = [
  {
    id: '1',
    name: 'Naru Noodle Bar (Demo)',
    slug: 'naru-noodle-bar',
    neighborhood: 'Indiranagar',
    instagramUrl: 'https://www.instagram.com/naru.demo/',
    heroImageUrl: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=1200'
  },
  {
    id: '2',
    name: 'Soka (Demo)',
    slug: 'soka',
    neighborhood: 'Koramangala',
    instagramUrl: 'https://www.instagram.com/soka.demo/',
    heroImageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200'
  }
];

router.get('/', async (_req, res) => {
  res.json(mockRestaurants);
});

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const restaurant = mockRestaurants.find(r => r.slug === slug);
  
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }
  
  res.json(restaurant);
});

export default router;
