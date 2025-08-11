import { z } from "zod";

export const Restaurant = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  neighborhood: z.string().nullable(),
  cuisineTags: z.array(z.string()).optional()
});

export const AvailabilityQuery = z.object({
  date: z.string(), // YYYY-MM-DD
  partySize: z.coerce.number().int().min(1).max(10)
});

export const TimeSlot = z.object({
  slotId: z.string(),
  time: z.string(), // HH:mm
  status: z.enum(["AVAILABLE", "CUTOFF", "FULL"])
});

export const HoldResponse = z.object({
  reservationId: z.string(),
  holdExpiresAt: z.string()
});
