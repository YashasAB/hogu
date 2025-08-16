import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import discoverRoutes from './routes/discover';
import restaurantRoutes from './routes/restaurants';
import reservationRoutes from './routes/reservations';
import adminRoutes from './routes/admin';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testDatabaseConnection();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 8080);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

// Set DATABASE_URL if not present (for deployment)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

// ---- Health routes FIRST, before anything heavy ----
app.get('/health', (_req, res) => res.status(200).json({ status: 'healthy' }));
app.get('/ready', (_req, res) => res.status(200).json({ status: 'ready' }));

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static files from React build in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const webDistPath = path.join(__dirname, '../../web/dist');
  app.use(express.static(webDistPath));
  console.log('Serving static files from:', webDistPath);
}

// Additional health check with database test (after server is listening)
app.get('/health/db', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/admin', adminRoutes);

// In production, serve the React app for all non-API routes
if (isProduction) {
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    const webDistPath = path.join(__dirname, '../../web/dist');
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Hogu API listening on http://0.0.0.0:${PORT}`);
});

// 🔑 Mount everything heavy AFTER we're listening
server.on('listening', async () => {
  try {
    // Lazy-import the file that mounts image routes
    const { mountImageRoutes } = await import('./mount-images');
    mountImageRoutes(app, prisma);
    console.log('✅ Image routes mounted');
  } catch (e) {
    console.error('⚠️ Failed to mount image routes (continuing):', e);
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});