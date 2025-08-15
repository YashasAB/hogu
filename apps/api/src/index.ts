import express from "express";
import cors from "cors";
import path from "path";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import discoverRoutes from "./routes/discover";
import restaurantRoutes from "./routes/restaurants";
import reservationRoutes from "./routes/reservations";
import adminRoutes from "./routes/admin";
import imagesRouter from "./routes/images";
import multer from "multer"; // Import multer

// Extend Express Request interface to include restaurantId
declare global {
  namespace Express {
    interface Request {
      restaurantId?: string;
    }
  }
}

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

testDatabaseConnection();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// Trust proxy for proper request handling
app.set("trust proxy", true);

console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
console.log("REPL_ID set:", !!process.env.REPL_ID);
if (process.env.REPL_ID) {
  console.log("REPL_ID:", process.env.REPL_ID);
}

// Set DATABASE_URL if not present (for deployment)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// Multer configuration for handling file uploads
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });

// Serve static files from React build in production
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  const webDistPath = path.join(__dirname, "../../web/dist");
  app.use(express.static(webDistPath));
  console.log("Serving static files from:", webDistPath);
}

// Health check endpoint for deployment
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hogu API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || "development",
  });
});

// Additional health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      port: PORT,
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness check endpoint
app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
  });
});

// Small helper: whatever comes back -> Node Buffer
function toNodeBuffer(v: unknown): Buffer {
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array)
    return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  if (Array.isArray(v) && v[0]) {
    const first = (v as any[])[0];
    if (Buffer.isBuffer(first)) return first;
    if (first instanceof Uint8Array)
      return Buffer.from(first.buffer, first.byteOffset, first.byteLength);
  }
  throw new Error("Unexpected storage value type");
}

// Minimal signature sniff (fallback to extension)
function detectContentType(buf: Buffer, filename: string): string {
  const hex4 = buf.subarray(0, 4).toString("hex");
  if (hex4.startsWith("ffd8")) return "image/jpeg";
  if (hex4 === "89504e47") return "image/png";
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";
  if (hex4.startsWith("4749")) return "image/gif";
  if (filename.toLowerCase().endsWith(".svg")) return "image/svg+xml";
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

// Image proxy route
app.get("/api/images/storage/:tenantId/:filename", async (req, res) => {
  try {
    const { tenantId, filename } = req.params;
    const key = `${tenantId}/${filename}`;

    const { Client } = await import("@replit/object-storage");
    const storage = new Client();

    const out: any = await storage.downloadAsBytes(key);
    if (!out?.ok || !out?.value) {
      return res
        .status(404)
        .json({ error: "Image not found", key, details: out?.error });
    }

    // Ensure we have raw binary
    const buf = toNodeBuffer(out.value);

    // Pick the correct image/* (NO charset)
    const ct = detectContentType(buf, filename);

    // Set headers explicitly. Do NOT use res.type()/res.contentType() (they can append charset).
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Ensure no conflicting header sneaks in from global CORS middleware:
    res.removeHeader?.("Access-Control-Allow-Credentials");

    // Let Express compute Content-Length; just send bytes
    return res.end(buf);
  } catch (err) {
    console.error("image proxy error:", err);
    return res.status(500).json({ error: "Error loading image" });
  }
});

// (Optional) HEAD – nice for CDNs/proxies
app.head("/api/images/storage/:tenantId/:filename", async (req, res) => {
  // You can reuse logic above to set headers without sending the body,
  // or simply 200 with cache headers if you don't need exact length.
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendStatus(200);
});

// Image list route
app.get("/api/images/list", async (req, res) => {
  try {
    const { Client } = await import("@replit/object-storage");
    const storage = new Client();

    // List all objects in the bucket
    const { ok, value, error } = await storage.list();

    if (!ok) {
      return res
        .status(500)
        .json({ error: "Failed to list images", details: error });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const images = value.map((item: any) => ({
      key: item.key,
      size: item.size,
      lastModified: item.lastModified,
      publicUrl: `${baseUrl}/api/images/storage/${item.key}`,
    }));

    res.json({
      totalImages: images.length,
      images: images,
    });
  } catch (error) {
    console.error("Error listing images:", error);
    res.status(500).json({ error: "Failed to list images" });
  }
});

// Upload endpoint for testing
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const restaurantId = req.body.restaurantId;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!restaurantId) {
      return res.status(400).json({ error: "No restaurantId provided" });
    }

    console.log(
      `Uploading test image: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`,
    );

    // Generate a unique filename
    const timestamp = Date.now();
    const ext = file.originalname.split(".").pop() || "jpg";
    const filename = `heroImage-${timestamp}.${ext}`;
    const objectKey = `${restaurantId}/${filename}`;

    const { Client } = await import("@replit/object-storage");
    const storage = new Client();

    // Upload to storage
    const uploadResult = await storage.uploadFromBytes(
      objectKey,
      file.buffer,
      {},
    );

    if (!uploadResult.ok) {
      console.error("Storage upload failed:", uploadResult.error);
      return res
        .status(500)
        .json({ error: "Storage upload failed", details: uploadResult.error });
    }

    // Return the proxy URL
    const imageUrl = `/api/images/storage/${objectKey}`;
    console.log(`✅ Test image uploaded successfully: ${imageUrl}`);

    res.json({
      message: "Upload successful",
      url: imageUrl,
      filename: filename,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Placeholder image route
app.get("/api/placeholder/:width/:height", (req, res) => {
  const { width, height } = req.params;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#374151"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="16">
        ${width}×${height}
      </text>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.send(svg);
});

// Mount API routes BEFORE static files
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imagesRouter);

// In production, serve the React app for all non-API routes
if (isProduction) {
  const webDistPath = path.join(__dirname, "../../web/dist");
  console.log("Serving static files from:", webDistPath);

  app.use(express.static(webDistPath, { index: false }));

  // Only catch non-API routes for SPA - this regex excludes any path starting with /api/
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hogu API listening on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});
