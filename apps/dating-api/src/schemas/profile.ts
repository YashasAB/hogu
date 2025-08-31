
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  tz: z.string().optional(),
  instagramHandle: z.string().optional(),
  profession: z.string().optional(),
  dreams: z.string().optional(),
  fiveYearGoal: z.string().optional(),
  whatIWantInPartner: z.string().optional(),
  whyPartnerWouldLikeMe: z.string().optional(),
  physicalActivity: z.enum(['RARELY', 'SOMETIMES', 'REGULAR', 'ATHLETE']).optional()
});

export const UpdateCuisinesSchema = z.object({
  cuisines: z.array(z.string())
});

export const UpdateInterestsSchema = z.object({
  tags: z.array(z.string())
});

export const UpdateFirstDateTypesSchema = z.object({
  types: z.array(z.enum(['COFFEE', 'QUICK_COCKTAIL', 'LUNCH', 'BREAKFAST', 'DINNER', 'GO_KARTING', 'PAINT_DATE', 'BOWLING', 'MUSEUM_WALK', 'LIVE_MUSIC', 'ICECREAM_WALK']))
});

export const UpdatePreferredNeighborhoodsSchema = z.object({
  neighborhoods: z.array(z.enum(['KALYAN_NAGAR', 'HSR_LAYOUT', 'WHITEFIELD', 'CENTRAL_BLR', 'INDIRANAGAR', 'KORAMANGALA']))
});

export const UpdateSeekingSchema = z.object({
  genders: z.array(z.enum(['FEMALE', 'MALE', 'NON_BINARY']))
});

export const AddPhotoSchema = z.object({
  url: z.string().url()
});
