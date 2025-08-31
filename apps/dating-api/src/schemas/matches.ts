
import { z } from 'zod';

export const IntentSchema = z.object({
  intent: z.enum(['YES', 'NO', 'MAYBE']),
  note: z.string().optional()
});

export const AvailabilitySlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  tz: z.string()
});

export const BulkAvailabilitySchema = z.object({
  slots: z.array(AvailabilitySlotSchema)
});

export const CreateMatchSchema = z.object({
  userId1: z.string().transform(val => BigInt(val)),
  userId2: z.string().transform(val => BigInt(val))
});

export const CreateBookingSchema = z.object({
  venueId: z.string().transform(val => BigInt(val)).optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  startTs: z.string().datetime().optional(),
  endTs: z.string().datetime().optional(),
  status: z.enum(['HELD', 'CONFIRMED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'REFUNDED']).optional()
});

export const UpdateMatchStatusSchema = z.object({
  status: z.enum(['NEW', 'SCHEDULE', 'SCHEDULED', 'CANCELLED'])
});
