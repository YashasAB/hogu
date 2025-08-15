import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import authRoutes from "./routes/auth";
import discoverRoutes from "./routes/discover";
import restaurantRoutes from "./routes/restaurants";
import reservationRoutes from "./routes/reservations";
import adminRoutes from "./routes/admin";
import imagesRouter from "./routes/images";
import multer from "multer"; // Import multer
import { AuthenticatedRestaurantRequest } from "./middleware/auth";
import getPort from "get-port"; // Import get-port

// Set DATABASE_URL fallback BEFORE creating PrismaClient
const dbDir = path.join(process.cwd(), "data");
fs.mkdirSync(dbDir, { recursive: true });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(dbDir, "prod.db")}`;
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const app = express();

// Health check endpoint for Autoscale - must be at root and return 200 immediately
app.get("/", (_req, res) => {
  console.log("HEALTH HIT");
  res.status(200).type("text/plain").send("ok");
});
app.get("/health", (_req, res) => res.status(200).json({ status: "healthy" }));
app.get("/ready", (_req, res) => res.status(200).json({ status: "ready" }));

// Add process error handlers to prevent silent crashes during deployment
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
  // DO NOT process.exit here during deploy
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
  // DO NOT process.exit here during deploy
});

// Trust proxy for proper request handling
app.set("trust proxy", true);

console.log("DEPLOY PORT ENV:", process.env.PORT);
console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("REPL_ID set:", !!process.env.REPL_ID);
if (process.env.REPL_ID) {
  console.log("REPL_ID:", process.env.REPL_ID);
}

// Middleware
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

// Test database connection on startup - don't exit on failure during deploy
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error(
      "❌ Database connection failed (continuing to serve):",
      error,
    );
    // DO NOT process.exit(1) during deploy - keep serving health checks
  }
}

// Initialize database connection asynchronously after health checks are set up
testDatabaseConnection();

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
      key: item.name,
      size: item.size,
      lastModified: item.updated || item.timeCreated,
      publicUrl: `${baseUrl}/api/images/storage/${item.name}`,
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
app.post(
  "/api/upload",
  upload.single("image"),
  async (req: AuthenticatedRestaurantRequest, res) => {
    try {
      const file = req.file;
      const restaurantId = req.body.restaurantId; // Get from form data instead
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      if (!restaurantId)
        return res.status(400).json({ error: "restaurantId is required" });

      // Validate file type
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image files are allowed" });
      }

      console.log(
        `Uploading hero image: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`,
      );

      const ext = file.originalname.split(".").pop() || "jpg";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `heroImage-${timestamp}.${ext}`;
      const objectKey = `${restaurantId}/${filename}`;

      const { Client } = await import("@replit/object-storage");
      const storage = new Client();

      // Clean up old hero images first
      try {
        const listResult = await storage.list();
        if (listResult.ok && listResult.value) {
          const oldHeroImages = listResult.value.filter(
            (item: any) =>
              item.name &&
              item.name.startsWith(`${restaurantId}/heroImage-`) &&
              item.name !== objectKey,
          );

          for (const oldImage of oldHeroImages) {
            console.log(`Deleting old hero image: ${oldImage.name}`);
            await storage.delete(oldImage.name);
          }
        }
      } catch (error) {
        console.warn("Failed to clean up old images:", error);
      }

      // Upload to storage
      const uploadResult = await storage.uploadFromBytes(
        objectKey,
        file.buffer,
        {
          compress: false, // Don't compress images
        },
      );

      if (!uploadResult.ok) {
        console.error("Storage upload failed:", uploadResult.error);
        return res.status(500).json({
          error: "Storage upload failed",
          details: uploadResult.error,
        });
      }

      // Update the restaurant's heroImageUrl in the database
      const imageUrl = `/api/images/storage/${objectKey}`;
      try {
        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: { heroImageUrl: imageUrl },
        });
        console.log(
          `✅ Updated restaurant ${restaurantId} heroImageUrl in database`,
        );
      } catch (dbError) {
        console.error("Failed to update database:", dbError);
        return res.status(500).json({
          error: "Image uploaded but failed to update database",
          details: dbError,
        });
      }

      console.log(`✅ Hero image uploaded successfully: ${imageUrl}`);

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
  },
);

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

// Dynamic hero image endpoint - standalone route (not nested)
app.get("/api/restaurant/:restaurantId/hero-image", async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const { Client } = await import("@replit/object-storage");
    const storage = new Client();

    // List all files in the restaurant's folder
    const listResult = await storage.list();
    if (!listResult.ok || !listResult.value) {
      return res.status(404).json({ error: "No images found" });
    }

    // Find hero images for this restaurant
    const heroImages = listResult.value
      .filter(
        (item: any) =>
          item.name && item.name.startsWith(`${restaurantId}/heroImage-`),
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.updated || b.timeCreated).getTime() -
          new Date(a.updated || a.timeCreated).getTime(),
      );

    if (heroImages.length === 0) {
      return res
        .status(404)
        .json({ error: "No hero image found for this restaurant" });
    }

    // Get the most recent hero image
    const latestHeroImage = heroImages[0];
    const imageData = await storage.downloadAsBytes(latestHeroImage.name);

    if (!imageData.ok || !imageData.value) {
      return res.status(404).json({ error: "Failed to retrieve image" });
    }

    // Ensure we have raw binary
    const buf = toNodeBuffer(imageData.value);

    // Detect content type
    const filename = latestHeroImage.name.split("/").pop() || "image.jpg";
    const contentType = detectContentType(buf, filename);

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send the image
    return res.end(buf);
  } catch (error) {
    console.error("Error serving hero image:", error);
    return res.status(500).json({ error: "Failed to serve hero image" });
  }
});

// Mount API routes BEFORE static files
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imagesRouter);

// Serve built React app in production
if (process.env.NODE_ENV === "production") {
  const webDistPath = path.join(__dirname, "../../web/dist");
  app.use(express.static(webDistPath, { index: false }));
}

// SPA routing fallback - must be after API routes
if (process.env.NODE_ENV === "production") {
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
  });
}

async function startServer() {
  const defaultPort = Number(process.env.PORT || 8080);
  
  // In production, use exact PORT env var. In dev, use get-port to avoid conflicts
  const PORT = process.env.NODE_ENV === 'production' 
    ? defaultPort 
    : await getPort({ port: defaultPort });

  console.log("Environment check:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("PORT:", PORT);
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
  console.log("REPL_ID set:", !!process.env.REPL_ID);
  if (process.env.REPL_ID) {
    console.log("REPL_ID:", process.env.REPL_ID);
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("[API] LISTENING PORT:", PORT, "PID:", process.pid, "NODE_ENV:", process.env.NODE_ENV);
    console.log(`✅ Hogu API listening on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
    console.log(`Health check available at: http://0.0.0.0:${PORT}/`);
  });
  (globalThis as any).__apiServer = server;

  // Configure server timeouts to prevent odd load balancer behavior
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.requestTimeout = 60000;

  server.on("error", (error) => {
    console.error("❌ Server error:", error);
    process.exit(1);
  });
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});