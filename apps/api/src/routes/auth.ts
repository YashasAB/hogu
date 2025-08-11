import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/register', async (req, res) => {
  const parse = RegisterSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { email, fullName } = parse.data;

  // Mock response without database
  const user = { id: '1', email, fullName };
  const token = 'mock-jwt-token';

  res.json({ token, user });
});

router.post('/login', async (req, res) => {
  const parse = LoginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { email } = parse.data;

  // Mock response without database
  const user = { id: '1', email, fullName: 'Demo User' };
  const token = 'mock-jwt-token';

  res.json({ token, user });
});

export default router;