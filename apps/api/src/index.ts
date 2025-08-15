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
import mime from "mime-types";

const app = express();

// Health check endpoint FIRST
app.get("/", (_req, res) => {
  console.log("[API] Health check hit at", new Date().toISOString());
  res.status(200).type("text/plain").send("ok");
});

// Get port from environment
const PORT = Number(process.env.PORT) || 8080;

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

// Upload endpoint
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { restaurantId } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." 
      });
    }

    // Get restaurant first
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = req.file.originalname.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedName = req.file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .substring(0, 20);
    const filename = `${sanitizedName}-${timestamp}.${extension}`;
    const key = `${restaurantId}/${filename}`;

    // Upload to object storage (no contentType option)
    const uploadResult = await storage.uploadFromBytes(key, req.file.buffer, {
      compress: false,
    });

    if (!uploadResult.ok) {
      return res.status(500).json({
        error: "Upload failed",
        details: uploadResult.error,
      });
    }

    // Update restaurant with new image URL
    const imageUrl = `/api/images/storage/${key}`;
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { heroImageUrl: imageUrl },
    });

    res.json({
      success: true,
      url: imageUrl,
      filename,
      key,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: "Upload failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Image serving endpoint
app.get("/api/images/storage/:replId/:filename", async (req, res) => {
  try {
    const { replId, filename } = req.params;
    const key = `${replId}/${filename}`;

    // Validate filename
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const result = await storage.downloadAsBytes(key) as
      | { ok: true; value: unknown }
      | { ok: false; error: unknown };

    if (!result?.ok) {
      return res.status(404).json({ 
        error: "Image not found", 
        key, 
        details: result?.error 
      });
    }

    const buffer = toNodeBuffer(result.value);
    const contentType = detectContentType(buffer, filename);
    const etag = `"${Buffer.from(key).toString('base64')}"`;

    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `inline; filename="${filename}"`,
      "ETag": etag,
    });

    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    return res.end(buffer);
  } catch (error) {
    console.error("Image serving error:", error);
    return res.status(500).json({ error: "Failed to serve image" });
  }
});

// Auth endpoints
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Email, password, and full name are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Restaurant endpoints
app.get("/api/restaurants", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(restaurants);
  } catch (error) {
    console.error("Restaurants fetch error:", error);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

app.get("/api/discover/available-today", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const slots = await prisma.timeSlot.findMany({
      where: {
        date: today,
        status: 'AVAILABLE'
      },
      include: {
        restaurant: true
      }
    });

    const groupedByRestaurant = slots.reduce((acc: any, slot) => {
      const restaurantId = slot.restaurantId;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          restaurant: slot.restaurant,
          slots: []
        };
      }
      acc[restaurantId].slots.push({
        slot_id: slot.id,
        time: slot.time,
        party_size: slot.partySize,
        date: slot.date
      });
      return acc;
    }, {});

    const restaurants = Object.values(groupedByRestaurant);
    res.json({ restaurants });
  } catch (error) {
    console.error("Available today error:", error);
    res.status(500).json({ error: "Failed to fetch available slots" });
  }
});

// User profile endpoint
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`[API] Server listening on http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Database URL set: ${!!process.env.DATABASE_URL}`);
      console.log(`Health check: http://0.0.0.0:${PORT}/`);
    });

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.requestTimeout = 60000;

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        prisma.$disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Only start if not in a test environment
if (require.main === module) {
  startServer();
}

export default app;