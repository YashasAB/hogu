
import { z } from "zod";

export const signupSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  dob: z.string().refine((date) => {
    const parsed = new Date(date);
    const age = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return age >= 18 && age <= 100;
  }, "Must be between 18 and 100 years old")
});

export const loginSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(1, "Password is required")
});
