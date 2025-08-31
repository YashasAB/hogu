
import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  tz: z.string(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['FEMALE', 'MALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY']),
  interestedIn: z.array(z.enum(['MALE', 'FEMALE', 'NON_BINARY'])).min(1)
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const RefreshSchema = z.object({
  refreshToken: z.string()
});

export type SignupData = z.infer<typeof SignupSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type RefreshData = z.infer<typeof RefreshSchema>;
