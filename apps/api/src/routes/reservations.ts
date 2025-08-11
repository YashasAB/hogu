import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const HoldSchema = z.object({
  restaurantId: z.string(),
  slotId: z.string(),
  partySize: z.number().int().min(1).max(10),
  userId: z.string()
});

router.post('/hold', async (req, res) => {
  const parse = HoldSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { restaurantId, slotId, partySize, userId } = parse.data;

  const slot = await prisma.inventorySlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.restaurantId !== restaurantId) return res.status(404).json({ error: 'Slot not found' });

  const free = slot.capacityTotal - slot.capacityBooked;
  if (free < partySize) return res.status(409).json({ error: 'Slot full' });

  const holdMinutes = 5;
  const hold = await prisma.$transaction(async (tx) => {
    await tx.inventorySlot.update({
      where: { id: slotId },
      data: { capacityBooked: { increment: partySize } }
    });
    return tx.reservation.create({
      data: {
        userId,
        restaurantId,
        slotId,
        partySize,
        status: 'HELD',
        holdExpiresAt: dayjs().add(holdMinutes, 'minute').toDate()
      }
    });
  });

  res.json({ reservationId: hold.id, holdExpiresAt: hold.holdExpiresAt });
});

router.post('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const r = await prisma.reservation.findUnique({ where: { id }, include: { slot: true } });
  if (!r) return res.status(404).json({ error: 'Reservation not found' });

  // TODO: attach payment method & deposit if required
  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: 'CONFIRMED' }
  });

  res.json(updated);
});

router.post('/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const r = await prisma.reservation.findUnique({ where: { id }, include: { slot: true } });
  if (!r) return res.status(404).json({ error: 'Reservation not found' });

  // Return capacity
  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({ where: { id }, data: { status: 'CANCELLED' } });
    await tx.inventorySlot.update({
      where: { id: r.slotId },
      data: { capacityBooked: { decrement: r.partySize } }
    });
  });

  res.json({ ok: true });
});

export default router;
