import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import restaurantRouter from './routes/restaurants';
import reservationsRouter from './routes/reservations';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/restaurants', restaurantRouter);
app.use('/reservations', reservationsRouter);

app.listen(PORT, () => {
  console.log(`Hogu API listening on http://localhost:${PORT}`);
});
