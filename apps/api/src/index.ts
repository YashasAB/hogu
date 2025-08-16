import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { Client } from "@replit/object-storage";
import getPort from "get-port";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; username: string; role?: string };
    }
  }
}

const app = express();

async function startServer() {
  const defaultPort = Number(process.env.PORT || 8080);

  // In production, use exact PORT env var. In dev, use get-port to avoid conflicts
  const PORT =
    process.env.NODE_ENV === "production"
      ? defaultPort
      : await getPort({ port: defaultPort });

  console.log("Environment check:");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Requested port:", defaultPort);
  console.log("Using port:", PORT);

  // Middleware setup
  app.set("trust proxy", true);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Database setup
  const dbDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dbDir, { recursive: true });
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${path.join(dbDir, "prod.db")}`;
  }

  const prisma = new PrismaClient();

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

  // Helper function to normalize buffer data
  function toNodeBuffer(v: unknown): Buffer {
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
      console.log("🖼️  Fetching image:", key);

      const out = (await storage.downloadAsBytes(key)) as
        | { ok: true; value: unknown }
        | { ok: false; error: unknown };

      if (!out?.ok) {
        console.warn("❌ Not found:", key, out?.error);
        return res
          .status(404)
          .json({ error: "Image not found", key, details: out?.error });
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

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password required" });
      }

      const userAuth = await prisma.userAuth.findUnique({
        where: { username },
        include: {
          user: true,
        },
      });

      if (
        !userAuth ||
        !(await bcrypt.compare(password, userAuth.passwordHash))
      ) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: userAuth.user.id, username: userAuth.username },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: {
          id: userAuth.user.id,
          username: userAuth.username,
          name: userAuth.user.name,
          email: userAuth.user.email,
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
        include: {
          auth: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.auth?.username,
          name: user.name,
          email: user.email,
        },
      });
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

      const targetDate =
        (date as string) || new Date().toISOString().split("T")[0];

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
  app.get(
    "/api/admin/restaurants",
    authenticateToken,
    async (req: any, res) => {
      try {
        // Check admin access
        const isAdmin = req.user && req.user.role === "ADMIN";
        if (!isAdmin) {
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
    },
  );

  // Health check endpoint FIRST and non-blocking
  app.get("/", (_req, res) => {
    console.log("[API] HEALTH HIT", new Date().toISOString());
    res.status(200).type("text/plain").send("ok");
  });
  app.get("/health", (_req, res) =>
    res.status(200).json({ status: "healthy" }),
  );
  app.get("/ready", (_req, res) => res.status(200).json({ status: "ready" }));

  // Start server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 API server running on http://0.0.0.0:${PORT}`);
    console.log(`📍 Health check: http://0.0.0.0:${PORT}/`);
  });
}

startServer().catch(console.error);
