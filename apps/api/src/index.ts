import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import mime from "mime-types";
import { Client } from "@replit/object-storage";
import getPort from "get-port";

// --- Health FIRST & non-blocking ---
const app = express();

app.get("/", (_req, res) => {
  console.log("[API] HEALTH HIT", new Date().toISOString());
  res.status(200).type("text/plain").send("ok");
});
app.get("/health", (_req, res) => res.status(200).json({ status: "healthy" }));
app.get("/ready", (_req, res) => res.status(200).json({ status: "ready" }));

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
  console.log("REPL_ID:", process.env.REPL_ID);

  // prevent double-binding in dev
  if (!(globalThis as any).__apiServer) {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`[API] LISTENING PORT: ${PORT} PID: ${process.pid} NODE_ENV: ${process.env.NODE_ENV}`);
      console.log("✅ Hogu API listening on http://0.0.0.0:" + PORT);
      console.log("Environment:", process.env.NODE_ENV || "development");
      console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
      console.log("Health check available at: http://0.0.0.0:" + PORT + "/");
    });
    (globalThis as any).__apiServer = server;
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.requestTimeout = 60000;
  }

  // ---- the rest of your setup AFTER listen() ----
  app.set("trust proxy", true);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // DB fallback dir (safe even in deploy)
  const dbDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dbDir, { recursive: true });
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${path.join(dbDir, "prod.db")}`;
  }

  // Initialize Prisma
  const prisma = new PrismaClient();

  // Test database connection
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }

  // JWT secret
  const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

  // Multer setup for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  });

  // Initialize Object Storage Client
  const storage = new Client();

  // Auth middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
  };

  // Helper function to get clean file key
  function getCleanFileKey(bucketKey: string): string {
    const parts = bucketKey.split("/");
    return parts[parts.length - 1];
  }

  // Test endpoint to check database image URLs
  app.get("/test-db-images", async (req, res) => {
    try {
      const restaurants = await prisma.restaurant.findMany({
        select: {
          id: true,
          name: true,
          heroImageUrl: true,
        },
      });

      const analysis = restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        heroImageUrl: restaurant.heroImageUrl,
        urlType: restaurant.heroImageUrl
          ? restaurant.heroImageUrl.startsWith("/api/images/storage/")
            ? "storage-api"
            : restaurant.heroImageUrl.startsWith("https://")
            ? "external"
            : "unknown"
          : "none",
      }));

      res.json({
        total: restaurants.length,
        withImages: analysis.filter((r) => r.heroImageUrl).length,
        analysis,
      });
    } catch (error) {
      console.error("Error checking database images:", error);
      res.status(500).json({ error: "Failed to check database images" });
    }
  });

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
      await storage.uploadFromBytes(key, req.file.buffer, {
        compress: false,
        contentType: req.file.mimetype,
      });

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

  // Serve images from object storage
  app.get("/api/images/storage/:replId/:filename", async (req, res) => {
    try {
      const { replId, filename } = req.params;
      const key = `${replId}/${filename}`;

      console.log("🖼️  Fetching image from storage:", key);

      const obj = await storage.downloadAsBytes(key);

      if (!obj.ok || !obj.value) {
        console.log("❌ Image not found in storage:", key);
        return res.status(404).json({ error: "Image not found" });
      }

      const u8 = obj.value; // Uint8Array
      const buffer = Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);

      // Set content type
      const contentType = mime.lookup(filename) || "application/octet-stream";
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=31536000"); // 1 year cache

      console.log("✅ Serving image:", key, "Size:", buffer.length, "bytes");
      res.send(buffer);
    } catch (error) {
      console.error("❌ Error serving image:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Check auth status
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, username: true, role: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ error: "Failed to check auth status" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // Get all restaurants with availability
  app.get("/api/discover/available-today", async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const restaurants = await prisma.restaurant.findMany({
        include: {
          timeSlots: {
            where: {
              date: today,
              status: "AVAILABLE",
            },
            orderBy: [{ time: "asc" }, { partySize: "asc" }],
          },
        },
      });

      const availableRestaurants = restaurants
        .filter((restaurant) => restaurant.timeSlots.length > 0)
        .map((restaurant) => ({
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            slug: restaurant.slug,
            neighborhood: restaurant.neighborhood,
            hero_image_url: restaurant.heroImageUrl,
            emoji: restaurant.emoji,
          },
          slots: restaurant.timeSlots.map((slot) => ({
            slot_id: slot.id,
            time: slot.time,
            party_size: slot.partySize,
            date: slot.date,
          })),
        }));

      res.json({ restaurants: availableRestaurants });
    } catch (error) {
      console.error("Error fetching available restaurants:", error);
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  });

  // Get restaurant by slug with available time slots
  app.get("/api/restaurants/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const { date } = req.query;

      const targetDate = (date as string) || new Date().toISOString().split("T")[0];

      const restaurant = await prisma.restaurant.findUnique({
        where: { slug },
        include: {
          timeSlots: {
            where: {
              date: targetDate,
              status: "AVAILABLE",
            },
            orderBy: [{ time: "asc" }, { partySize: "asc" }],
          },
        },
      });

      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      const formattedSlots = restaurant.timeSlots.map((slot) => ({
        slot_id: slot.id,
        time: slot.time,
        party_size: slot.partySize,
        date: slot.date,
      }));

      res.json({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          neighborhood: restaurant.neighborhood,
          hero_image_url: restaurant.heroImageUrl,
          emoji: restaurant.emoji,
        },
        slots: formattedSlots,
      });
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ error: "Failed to fetch restaurant" });
    }
  });

  // Admin routes
  app.get("/api/admin/restaurants", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const restaurants = await prisma.restaurant.findMany({
        orderBy: { name: "asc" },
      });

      res.json({ restaurants });
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ error: "Failed to fetch restaurants" });
    }
  });

  app.put("/api/admin/restaurants/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const { name, neighborhood, instagramUrl, website, heroImageUrl } = req.body;

      const restaurant = await prisma.restaurant.update({
        where: { id },
        data: {
          name,
          neighborhood,
          instagramUrl,
          website,
          heroImageUrl,
        },
      });

      res.json({ restaurant });
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).json({ error: "Failed to update restaurant" });
    }
  });

  // Error handlers
  process.on("unhandledRejection", (r) => console.error("[API] UNHANDLED REJECTION:", r));
  process.on("uncaughtException", (e) => console.error("[API] UNCAUGHT EXCEPTION:", e));
}

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});