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
app.set('trust proxy', true);

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

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imagesRouter);

app.get("/api/images/storage/:replId/:filename", async (req, res) => {
  try {
    const { replId, filename } = req.params;
    const key = `${replId}/${filename}`;

    const { Client } = await import("@replit/object-storage");
    const storage = new Client();

    // 🔒 Narrow the union to a clean shape TS understands
    type BytesOk = { ok: true; value: Uint8Array };
    type BytesErr = { ok: false; error: unknown };
    const out = (await storage.downloadAsBytes(key)) as BytesOk | BytesErr;

    if (!out.ok) {
      console.error("❌ DOWNLOAD FAILED:", out.error);
      return res.status(404).json({ error: "Image not found", path: key, details: out.error });
    }

    // ✅ out.value is now a Uint8Array
    const u8 = out.value;

    // ✅ Use ArrayBuffer+offsets overload (no ambiguity)
    const buffer = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);

    // (Optional) quick signature log
    console.log("signature:", buffer.subarray(0, 4).toString("hex"));

    // Content type from extension (or sniff if you want)
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"  ? "image/png"  :
      ext === "jpg"  ? "image/jpeg" :
      ext === "jpeg" ? "image/jpeg" :
      ext === "gif"  ? "image/gif"  :
      ext === "webp" ? "image/webp" :
      ext === "svg"  ? "image/svg+xml" :
      "application/octet-stream";

    res.set({
      "Content-Type": contentType,
      // Let Express compute length to avoid mismatches:
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
      "Content-Disposition": `inline; filename="${filename}"`,
    });

    return res.end(buffer); // <- send raw bytes (not [buffer])
  } catch (err) {
    console.error("💥 FATAL ERROR in image proxy:", err);
    return res.status(500).json({
      error: "Error loading image",
      details: err instanceof Error ? err.message : String(err),
    });
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

// In production, serve the React app for all non-API routes
if (isProduction) {
  const webDistPath = path.join(__dirname, "../../web/dist");
  console.log("Serving static files from:", webDistPath);

  app.use(express.static(webDistPath, { index: false }));

  // Only catch non-API routes for SPA
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