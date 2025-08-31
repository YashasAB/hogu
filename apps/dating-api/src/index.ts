
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Route imports
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import matchRoutes from './routes/matches';
import adminRoutes from './routes/admin';
import threadRoutes from './routes/threads';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Initialize Prisma
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/me', profileRoutes);
app.use('/matches', matchRoutes);
app.use('/admin', adminRoutes);
app.use('/threads', threadRoutes);

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🎯 Hogu Dating API listening on http://0.0.0.0:${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

export { prisma };
