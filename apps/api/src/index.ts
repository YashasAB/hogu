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

// Image proxy route for Replit storage - downloads and serves image bytes
app.get("/api/images/storage/:replId/:filename", async (req, res) => {
  try {
    const { replId, filename } = req.params;
    const filePath = `${replId}/${filename}`;

    console.log(`=== IMAGE PROXY REQUEST START ===`);
    console.log(`🔍 Request path: ${req.path}`);
    console.log(`🔍 Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    console.log(`📁 File path to download: ${filePath}`);
    console.log(`👤 User Agent: ${req.get('User-Agent')}`);
    console.log(`🌐 Origin: ${req.get('Origin')}`);
    console.log(`📨 Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`⏰ Request timestamp: ${new Date().toISOString()}`);

    // Import the Object Storage client
    console.log(`📦 Importing Object Storage client...`);
    const { Client } = await import("@replit/object-storage");
    const storageClient = new Client();
    console.log(`✅ Object Storage client created successfully`);

    // Download the image as bytes
    console.log(`⬇️ Starting download for: ${filePath}`);
    const startTime = Date.now();

    const {
      ok,
      value: bytesValue,
      error,
    } = await storageClient.downloadAsBytes(filePath);

    const downloadTime = Date.now() - startTime;
    console.log(`⏱️ Download completed in ${downloadTime}ms`);

    if (!ok) {
      console.error(`❌ DOWNLOAD FAILED for: ${filePath}`);
      console.error(`❌ Error details:`, error);
      console.error(`❌ Error type:`, typeof error);
      console.error(`❌ Error stringified:`, JSON.stringify(error, null, 2));
      return res.status(404).json({
        error: "Image not found",
        path: filePath,
        details: error,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ DOWNLOAD SUCCESSFUL for: ${filePath}`);
    console.log(`📊 Image data analysis:`);
    console.log(`   - Raw bytes length: ${bytesValue?.length || 0}`);
    console.log(`   - Bytes type: ${typeof bytesValue}`);
    console.log(`   - Is Array: ${Array.isArray(bytesValue)}`);
    console.log(`   - Constructor: ${bytesValue?.constructor?.name}`);

    // Log first few bytes for verification
    if (bytesValue && bytesValue.length > 0) {
      const firstBytes = Array.from(bytesValue.slice(0, 16) as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ');
      console.log(`   - First 16 bytes (hex): ${firstBytes}`);

      // Check for common image file signatures
      const signature = Array.from(bytesValue.slice(0, 4) as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('');
      console.log(`   - File signature: ${signature}`);

      if (signature.startsWith('ffd8')) {
        console.log(`   - ✅ Valid JPEG signature detected`);
      } else if (signature.startsWith('8950')) {
        console.log(`   - ✅ Valid PNG signature detected`);
      } else {
        console.log(`   - ⚠️ Unknown or unexpected file signature`);
      }
    }

    // Convert to different formats for logging
    const buffer = Buffer.from(bytesValue);
    console.log(`🔄 Buffer conversion:`);
    console.log(`   - Buffer length: ${buffer.length}`);
    console.log(`   - Buffer type: ${typeof buffer}`);
    console.log(`   - Is Buffer: ${Buffer.isBuffer(buffer)}`);

    // Determine content type based on file extension
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "image/jpeg"; // default

    console.log(`🎯 File extension: ${ext}`);

    switch (ext) {
      case "png":
        contentType = "image/png";
        break;
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "webp":
        contentType = "image/webp";
        break;
      case "svg":
        contentType = "image/svg+xml";
        break;
    }

    console.log(`📋 Content-Type determined: ${contentType}`);

    // Set appropriate headers with more permissive CORS
    const responseHeaders = {
      "Content-Type": contentType,
      "Content-Length": buffer.length.toString(),
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Cache-Control",
    };

    console.log(`📤 Response headers:`, JSON.stringify(responseHeaders, null, 2));

    res.set(responseHeaders);

    console.log(`🚀 Sending response...`);
    console.log(`   - Sending buffer of ${buffer.length} bytes`);
    console.log(`   - Response status: 200`);

    // Send the image bytes as a Buffer
    res.send(buffer);

    console.log(`✅ Response sent successfully`);
    console.log(`=== IMAGE PROXY REQUEST END ===\n`);

  } catch (error: unknown) {
    console.error(`💥 FATAL ERROR in image proxy:`);
    console.error(`   - Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   - Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`   - Error type: ${typeof error}`);
    console.error(`   - Error stringified:`, JSON.stringify(error, null, 2));
    console.error(`=== IMAGE PROXY ERROR END ===\n`);

    res.status(500).json({
      error: "Error loading image",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
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
  app.get("*", (req, res) => {
    const webDistPath = path.join(__dirname, "../../web/dist");
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