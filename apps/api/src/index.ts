import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Client } from "@replit/object-storage";

// ---- Express Request augmentation (for req.user) ----
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; username: string; role?: string };
    }
  }
}

const app = express();

// ======================
// 1) HEALTH FIRST
// ======================
app.get("/", (_req, res) => {
  console.log("[API] HEALTH HIT", new Date().toISOString());
  res.status(200).type("text/plain").send("ok");
});
app.get("/health", (_req, res) => res.status(200).json({ status: "healthy" }));
app.get("/ready", (_req, res) => res.status(200).json({ status: "ready" }));

// ======================
// 2) BIND IMMEDIATELY
// ======================
const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.REPLIT_ENVIRONMENT === "production";
const injected = process.env.PORT;
const PORT = isProd ? Number(injected) : Number(injected || 8080);

if (isProd && !injected) {
  console.error(
    "[API] FATAL: PORT not injected by platform. Exiting so deploy retries.",
  );
  process.exit(1);
}

// avoid double-binding on hot reloads
if (!(globalThis as any).__apiServerPrimary) {
  const s = app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[API] LISTENING PORT: ${PORT} PID: ${process.pid} NODE_ENV: ${process.env.NODE_ENV}`,
    );
    console.log(`[API] Health: http://0.0.0.0:${PORT}/`);
  });
  (globalThis as any).__apiServerPrimary = s;
}

// ======================
// 3) DEFER SETUP UNTIL AFTER LISTEN
// ======================
setImmediate(async () => {
  try {
    console.log("[API] Bootstrapping app…");

    // ---------- Middleware ----------
    app.set("trust proxy", true);
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    // ---------- DB (non-blocking) ----------
    const dbDir = path.join(process.cwd(), "data");
    fs.mkdirSync(dbDir, { recursive: true });
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = `file:${path.join(dbDir, "prod.db")}`;
    }
    const prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
    prisma
      .$connect()
      .then(() => console.log("✅ Database connected successfully"))
      .catch((e) =>
        console.error("❌ Database connection failed (continuing):", e),
      );

    // ---------- JWT secret ----------
    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

    // ---------- Multer ----------
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    });

    // ---------- Object Storage (lazy) ----------
    let storageClient: Client | null = null;
    async function getStorageClient(): Promise<Client> {
      if (!storageClient) {
        storageClient = new Client();
        console.log("✅ Object Storage client initialized");
      }
      return storageClient;
    }

    // ---------- Helpers ----------
    function toNodeBuffer(v: unknown): Buffer {
      if (Buffer.isBuffer(v)) return v;
      if (v instanceof Uint8Array)
        return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
      if (Array.isArray(v) && v.length) {
        const first = (v as any)[0];
        if (Buffer.isBuffer(first)) return first;
        if (first instanceof Uint8Array)
          return Buffer.from(first.buffer, first.byteOffset, first.byteLength);
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

    // ---------- AUTH MIDDLEWARE (your original) ----------
    const authenticateToken = (req: any, res: any, next: any) => {
      const token =
        req.cookies?.token || req.headers.authorization?.split(" ")[1];
      if (!token)
        return res.status(401).json({ error: "Access token required" });
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
      } catch {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
    };

    // ======================
    // 4) YOUR ORIGINAL ROUTES
    // (UNCHANGED)
    // ======================

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
        console.log("📤 Starting upload for restaurant:", restaurantId);

        const restaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
        });
        if (!restaurant)
          return res.status(404).json({ error: "Restaurant not found" });

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const extension = req.file.originalname.split(".").pop() || "jpg";
        const filename = `heroImage-${timestamp}.${extension}`;
        const key = `${restaurantId}/${filename}`;

        const storage = await getStorageClient();
        const uploadResult = await storage.uploadFromBytes(
          key,
          req.file.buffer,
          { compress: false },
        );
        if (!uploadResult.ok) {
          return res
            .status(500)
            .json({ error: "Upload failed", details: uploadResult.error });
        }

        const imageUrl = `/api/images/storage/${key}`;
        const updatedRestaurant = await prisma.restaurant.update({
          where: { id: restaurantId },
          data: { heroImageUrl: imageUrl },
        });

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

        const storage = await getStorageClient();
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
          include: { user: true },
        });

        if (
          !userAuth ||
          !(await bcrypt.compare(password, userAuth.passwordHash))
        ) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
          {
            userId: userAuth.user.id,
            username: userAuth.username,
          },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: isProd,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
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
          include: { auth: true },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
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
              where: { date: today, status: "AVAILABLE" },
              orderBy: [{ time: "asc" }, { partySize: "asc" }],
            },
          },
        });

        const availableRestaurants = restaurants
          .filter((r) => r.timeSlots.length > 0)
          .map((r) => ({
            restaurant: {
              id: r.id,
              name: r.name,
              slug: r.slug,
              neighborhood: r.neighborhood,
              hero_image_url: r.heroImageUrl,
              emoji: r.emoji,
            },
            slots: r.timeSlots.map((slot) => ({
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
              where: { date: targetDate, status: "AVAILABLE" },
              orderBy: [{ time: "asc" }, { partySize: "asc" }],
            },
          },
        });

        if (!restaurant)
          return res.status(404).json({ error: "Restaurant not found" });

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
          slots: restaurant.timeSlots.map((slot) => ({
            slot_id: slot.id,
            time: slot.time,
            party_size: slot.partySize,
            date: slot.date,
          })),
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
          const isAdmin = req.user && req.user.role === "ADMIN";
          if (!isAdmin)
            return res.status(403).json({ error: "Admin access required" });

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

    // ---------- Optional static (prod) ----------
    if (isProd) {
      const webDistPath = path.join(process.cwd(), "../..", "web", "dist");
      app.use(express.static(webDistPath, { index: false }));
      app.get(/^\/(?!api\/)(?!$)(?!health$)(?!ready$).*/, (_req, res) => {
        res.sendFile(path.join(webDistPath, "index.html"));
      });
    }

    // ---------- Global error logs ----------
    process.on("unhandledRejection", (r) =>
      console.error("[API] UNHANDLED REJECTION:", r),
    );
    process.on("uncaughtException", (e) =>
      console.error("[API] UNCAUGHT EXCEPTION:", e),
    );

    console.log("[API] Bootstrap complete.");
  } catch (e) {
    console.error("[API] Bootstrap failed (continuing to serve health):", e);
  }
});
