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

    console.log(`=== IMAGE PROXY REQUEST ===`);
    console.log(`Request path: ${req.path}`);
    console.log(`Downloading file: ${filePath}`);

    // Import the Object Storage client
    const { Client } = await import("@replit/object-storage");
    const storageClient = new Client();

    // Download the image as bytes
    const {
      ok,
      value: bytesValue,
      error,
    } = await storageClient.downloadAsBytes(filePath);

    if (!ok) {
      console.error(`❌ Failed to download image: ${filePath}`, error);
      return res.status(404).send("Image not found");
    }

    console.log(`✅ Successfully downloaded image: ${filePath}`);

    // Determine content type based on file extension
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "image/jpeg"; // default

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

    // Set appropriate headers
    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      "Access-Control-Allow-Origin": "*",
    });

    // Send the image bytes
    res.send(bytesValue);
  } catch (error) {
    console.error("Error downloading image:", error);
    res.status(500).send("Error loading image");
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
