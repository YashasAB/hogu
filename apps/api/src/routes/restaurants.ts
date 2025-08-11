import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

const prisma = new PrismaClient();
const router = Router();

const S3_BUCKET = process.env.S3_BUCKET;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
let s3: S3Client | null = null;
if (S3_BUCKET) {
  s3 = new S3Client({ region: AWS_REGION });
}


router.get('/', async (req, res) => {
  const q = (req.query.q as string) || '';
  const restaurants = await prisma.restaurant.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' }
  });
  res.json(restaurants);
});

const AvailabilityQuery = z.object({
  date: z.string(),
  partySize: z.coerce.number().int().min(1).max(10)
});

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const r = await prisma.restaurant.findUnique({ where: { slug } });
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

router.get('/:id/availability', async (req, res) => {
  const { id } = req.params;
  const parse = AvailabilityQuery.safeParse(req.query);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { date, partySize } = parse.data;

  const slots = await prisma.inventorySlot.findMany({
    where: { restaurantId: id, date, partySize },
    orderBy: { time: 'asc' }
  });

  const mapped = slots.map(s => {
    const free = s.capacityTotal - s.capacityBooked;
    const status = free > 0 ? "AVAILABLE" : "FULL";
    return { slotId: s.id, time: s.time, status };
  });

  res.json(mapped);
});

export default router;


router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, website, instagram_url, hero_image_url, neighborhood } = req.body || {};
  try {
    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(neighborhood !== undefined ? { neighborhood } : {}),
        ...(instagram_url !== undefined ? { instagramUrl: instagram_url } : {}),
        ...(hero_image_url !== undefined ? { heroImageUrl: hero_image_url } : {}),
      }
    });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: 'Update failed', detail: String(e) });
  }
});


router.get('/:id/photos', async (req, res) => {
  const { id } = req.params;
  const photos = await prisma.restaurantPhoto.findMany({
    where: { restaurantId: id },
    orderBy: { sortOrder: 'asc' }
  });
  res.json(photos);
});

router.post('/:id/photos/presign', async (req, res) => {
  const { id } = req.params;
  if (!s3 || !S3_BUCKET) return res.status(400).json({ error: 'S3 not configured' });
  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });
  const key = `restaurants/${id}/${Date.now()}-${filename}`;
  try {
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: S3_BUCKET,
      Key: key,
      Conditions: [
        ["content-length-range", 0, 10485760],
        {"Content-Type": contentType}
      ],
      Fields: { "Content-Type": contentType },
      Expires: 300
    });
    const publicUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    res.json({ url, fields, key, publicUrl });
  } catch (e) {
    res.status(500).json({ error: 'presign failed', detail: String(e) });
  }
});

// Record uploaded photo (S3) or accept any URL in dev
router.post('/:id/photos', async (req, res) => {
  const { id } = req.params;
  const { url, alt, sort_order } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });
  const photo = await prisma.restaurantPhoto.create({
    data: { restaurantId: id, url, alt, sortOrder: Number(sort_order) || 0 }
  });
  res.json(photo);
});

router.patch('/:id/photos/:photoId', async (req, res) => {
  const { photoId } = req.params;
  const { alt, sort_order } = req.body || {};
  const updated = await prisma.restaurantPhoto.update({
    where: { id: photoId },
    data: {
      ...(alt !== undefined ? { alt } : {}),
      ...(sort_order !== undefined ? { sortOrder: Number(sort_order) } : {})
    }
  });
  res.json(updated);
});

router.delete('/:id/photos/:photoId', async (req, res) => {
  const { photoId } = req.params;
  await prisma.restaurantPhoto.delete({ where: { id: photoId } });
  res.json({ ok: true });
});
