import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
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

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hogu API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Additional health check endpoint
app.get('/health', async (req, res) => {
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
  app.get('*', (req, res) => {
    const webDistPath = path.join(__dirname, '../../web/dist');
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hogu API listening on http://0.0.0.0:${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Helper function to normalize buffer data
function toNodeBuffer(v: unknown): Buffer {
  console.log("Processing buffer data...");
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array) {
    return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  }
  if (Array.isArray(v) && v.length) {
    const first = (v as any)[0];
    if (Buffer.isBuffer(first)) return first;
    if (first instanceof Uint8Array) {
      return Buffer.from(first.buffer, first.byteOffset, first.byteLength);
    }
  }
  throw new Error("Unexpected storage value type from downloadAsBytes");
}

function detectContentType(buf: Buffer, filename: string): string {
  const hex4 = buf.subarray(0, 4).toString("hex");
  if (hex4.startsWith("ffd8")) return "image/jpeg";
  if (hex4 === "89504e47") return "image/png";
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "image/webp";
  if (hex4.startsWith("4749")) return "image/gif";
  if (filename.toLowerCase().endsWith(".svg")) return "image/svg+xml";
  
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

// Multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Object storage client
async function getStorageClient() {
  const { Client } = await import("@replit/object-storage");
  return new Client();
}

// Upload endpoint with automatic database update
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { restaurantId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    console.log("📤 Starting upload process for restaurant:", restaurantId);

    // Get restaurant first to make sure it exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = req.file.originalname.split(".").pop() || "jpg";
    const filename = `heroImage-${timestamp}.${extension}`;
    const key = `${restaurantId}/${filename}`;

    console.log("📁 Uploading to object storage with key:", key);

    // Upload to object storage
    const storage = await getStorageClient();
    const uploadResult = await storage.uploadFromBytes(key, req.file.buffer, {
      compress: false,
    });

    if (!uploadResult.ok) {
      return res.status(500).json({
        error: "Upload failed",
        details: uploadResult.error,
      });
    }

    console.log("✅ Upload successful, updating database...");

    // Update restaurant with new image URL
    const imageUrl = `/api/images/storage/${key}`;
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { heroImageUrl: imageUrl },
    });

    console.log("✅ Database updated with new image URL:", imageUrl);

    res.json({
      success: true,
      url: imageUrl,
      filename,
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/images/storage/:replId/:filename
app.get("/api/images/storage/:replId/:filename", async (req, res) => {
  try {
    const { replId, filename } = req.params;
    const key = `${replId}/${filename}`;
    
    console.log("🖼️ Fetching image:", key);

    const storage = await getStorageClient();
    const out = (await storage.downloadAsBytes(key)) as
      | { ok: true; value: unknown }
      | { ok: false; error: unknown };

    if (!out?.ok) {
      console.warn("❌ Not found:", key, out?.error);
      return res.status(404).json({
        error: "Image not found",
        key,
        details: out?.error,
      });
    }

    const buf = toNodeBuffer(out.value);
    const contentType = detectContentType(buf, filename);

    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": String(buf.length),
      "Content-Disposition": `inline; filename="${filename}"`,
    });

    console.log(`✅ Serving ${key} (${contentType}, ${buf.length} bytes)`);
    return res.end(buf);
  } catch (err) {
    console.error("❌ Image proxy error:", err);
    return res.status(500).json({ error: "Failed to serve image" });
  }
});

// HEAD for probes/CDNs
app.head("/api/images/storage/:replId/:filename", async (req, res) => {
  try {
    const { replId, filename } = req.params;
    const key = `${replId}/${filename}`;

    const storage = await getStorageClient();
    const out = (await storage.downloadAsBytes(key)) as
      | { ok: true; value: unknown }
      | { ok: false; error: unknown };

    if (!out?.ok) return res.sendStatus(404);

    const buf = toNodeBuffer(out.value);
    const contentType = detectContentType(buf, filename);

    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": String(buf.length),
      "Content-Disposition": `inline; filename="${filename}"`,
    });

    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});