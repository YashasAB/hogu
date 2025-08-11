import { Router } from 'express';
import { z } from 'zod';

const router = Router();

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

export default router;