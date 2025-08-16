
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import cookieParser from "cookie-parser";

const app = express();

// === HEALTH FIRST (fast, no deps) ===
app.get("/", (_req, res) => {
  console.log("[API] HEALTH HIT", new Date().toISOString());
  res.status(200).type("text/plain").send("ok");
});
app.get("/health", (_req, res) => res.status(200).json({ status: "healthy" }));
app.get("/ready", (_req, res) => res.status(200).json({ status: "ready" }));

// === BIND IMMEDIATELY ===
// In production (Autoscale), ALWAYS use injected PORT. Fail fast if missing.
const isProd = process.env.NODE_ENV === "production" || process.env.REPLIT_ENVIRONMENT === "production";
const injected = process.env.PORT;
const PORT = isProd ? Number(injected) : Number(injected || 8080);

if (isProd && !injected) {
  console.error("[API] FATAL: PORT was not injected by platform. Exiting.");
  process.exit(1);
}

// Prevent double-binding during hot reload
if (!(globalThis as any).__apiServerPrimary) {
  const primary = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[API] LISTENING PORT: ${PORT} PID: ${process.pid} NODE_ENV: ${process.env.NODE_ENV}`);
  });
  (globalThis as any).__apiServerPrimary = primary;

  // Optional "belt & suspenders": also open 5555 in prod to satisfy any stale mapping
  // Remove this once promote works and the mapping is clean.
  if (isProd && PORT !== 5555 && !(globalThis as any).__apiServerCompat) {
    try {
      const compat = app.listen(5555, "0.0.0.0", () => {
        console.log("[API] ALSO LISTENING on 5555 (compat for stale port mapping)");
      });
      (globalThis as any).__apiServerCompat = compat;
    } catch (e) {
      console.log("[API] Compat 5555 bind not used (ok).");
    }
  }
}

// === DEFER HEAVY SETUP UNTIL AFTER LISTEN ===
setImmediate(async () => {
  try {
    console.log("[API] Bootstrapping middleware & routes…");

    app.set("trust proxy", true);
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    // Light, safe helpers for images
    function toNodeBuffer(v: unknown): Buffer {
      if (Buffer.isBuffer(v)) return v;
      if (v instanceof Uint8Array) return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
      if (Array.isArray(v) && v.length) {
        const first = (v as any)[0];
        if (Buffer.isBuffer(first)) return first;
        if (first instanceof Uint8Array) return Buffer.from(first.buffer, first.byteOffset, first.byteLength);
      }
      throw new Error("Unexpected storage value type");
    }
    function detectContentType(buf: Buffer, filename: string): string {
      const hex4 = buf.subarray(0, 4).toString("hex");
      if (hex4.startsWith("ffd8")) return "image/jpeg";
      if (hex4 === "89504e47") return "image/png";
      if (buf.subarray(0,4).toString("ascii")==="RIFF" && buf.subarray(8,12).toString("ascii")==="WEBP") return "image/webp";
      if (hex4.startsWith("4749")) return "image/gif";
      if (filename.toLowerCase().endsWith(".svg")) return "image/svg+xml";
      const ext = filename.split(".").pop()?.toLowerCase();
      if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
      if (ext === "png") return "image/png";
      if (ext === "gif") return "image/gif";
      if (ext === "webp") return "image/webp";
      return "application/octet-stream";
    }

    // --- DB (don't block startup / health) ---
    const dbDir = path.join(process.cwd(), "data");
    fs.mkdirSync(dbDir, { recursive: true });
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = `file:${path.join(dbDir, "prod.db")}`;
    }
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    prisma.$connect().then(() => console.log("✅ Database connected")).catch(e => {
      console.error("❌ DB connect failed (continuing to serve):", e);
    });

    // --- JWT secret ---
    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

    // --- Object Storage (lazy) ---
    const { Client } = await import("@replit/object-storage");
    let storageClient: InstanceType<typeof Client> | null = null;
    async function getStorageClient() {
      return storageClient ?? (storageClient = new Client());
    }

    // --- Multer setup ---
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

    // --- Auth middleware ---
    const authenticateToken = (req: any, res: any, next: any) => {
      const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
    };

    // === YOUR EXISTING ROUTES ===

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

    // Login endpoint
    app.post("/api/auth/login", async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res
            .status(400)
            .json({ error: "Username and password required" });
        }

        const bcrypt = require("bcrypt");
        const jwt = require("jsonwebtoken");

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
          },
        });
      } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ error: "Login failed" });
      }
    });

    // Registration endpoint
    app.post("/api/auth/register", async (req, res) => {
      try {
        const { username, password, email, fullName } = req.body;

        if (!username || !password) {
          return res
            .status(400)
            .json({ error: "Username and password required" });
        }

        const bcrypt = require("bcrypt");
        const jwt = require("jsonwebtoken");

        // Check if username exists
        const existingAuth = await prisma.userAuth.findUnique({
          where: { username },
        });

        if (existingAuth) {
          return res.status(409).json({ error: "Username already exists" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user and auth in transaction
        const result = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              externalId: `user_${Date.now()}`,
            },
          });

          const userAuth = await tx.userAuth.create({
            data: {
              userId: user.id,
              username,
              passwordHash,
            },
          });

          if (email || fullName) {
            await tx.userDetails.create({
              data: {
                userId: user.id,
                email,
                name: fullName,
              },
            });
          }

          return { user, userAuth };
        });

        const token = jwt.sign(
          { userId: result.user.id, username: result.userAuth.username },
          JWT_SECRET,
          { expiresIn: "7d" },
        );

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
          user: {
            id: result.user.id,
            username: result.userAuth.username,
          },
        });
      } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
      }
    });

    // Logout endpoint
    app.post("/api/auth/logout", (req, res) => {
      res.clearCookie("token");
      res.json({ message: "Logged out successfully" });
    });

    // Current user endpoint
    app.get("/api/auth/me", authenticateToken, async (req, res) => {
      try {
        const userAuth = await prisma.userAuth.findUnique({
          where: { userId: req.user.userId },
          include: {
            user: {
              include: {
                details: true,
              },
            },
          },
        });

        if (!userAuth) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({
          user: {
            id: userAuth.user.id,
            username: userAuth.username,
            details: userAuth.user.details,
          },
        });
      } catch (error) {
        console.error("❌ Get current user error:", error);
        res.status(500).json({ error: "Failed to get user info" });
      }
    });

    // Get all restaurants
    app.get("/api/restaurants", async (req, res) => {
      try {
        const restaurants = await prisma.restaurant.findMany({
          include: {
            _count: {
              select: { reservations: true },
            },
          },
        });
        res.json(restaurants);
      } catch (error) {
        console.error("❌ Get restaurants error:", error);
        res.status(500).json({ error: "Failed to fetch restaurants" });
      }
    });

    // Get restaurant by ID or slug
    app.get("/api/restaurants/:identifier", async (req, res) => {
      try {
        const { identifier } = req.params;

        const restaurant = await prisma.restaurant.findFirst({
          where: {
            OR: [{ id: identifier }, { slug: identifier }],
          },
          include: {
            inventory: {
              include: {
                timeSlot: true,
              },
            },
          },
        });

        if (!restaurant) {
          return res.status(404).json({ error: "Restaurant not found" });
        }

        res.json(restaurant);
      } catch (error) {
        console.error("❌ Get restaurant error:", error);
        res.status(500).json({ error: "Failed to fetch restaurant" });
      }
    });

    // Get available restaurants for today
    app.get("/api/discover/available-today", async (req, res) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const restaurants = await prisma.restaurant.findMany({
          include: {
            inventory: {
              where: {
                date: {
                  gte: today,
                  lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                },
                availableCount: {
                  gt: 0,
                },
              },
              include: {
                timeSlot: true,
              },
            },
          },
        });

        const availableRestaurants = restaurants
          .filter((restaurant) => restaurant.inventory.length > 0)
          .map((restaurant) => ({
            restaurant: {
              id: restaurant.id,
              name: restaurant.name,
              slug: restaurant.slug,
              neighborhood: restaurant.neighborhood,
              hero_image_url: restaurant.heroImageUrl,
              emoji: restaurant.emoji,
            },
            slots: restaurant.inventory.map((inv) => ({
              slot_id: inv.id,
              time: inv.timeSlot.time,
              party_size: inv.partySize,
              date: inv.date.toISOString().split("T")[0],
            })),
          }));

        res.json({ restaurants: availableRestaurants });
      } catch (error) {
        console.error("❌ Get available restaurants error:", error);
        res.status(500).json({ error: "Failed to fetch available restaurants" });
      }
    });

    // Make a reservation
    app.post("/api/reservations", authenticateToken, async (req, res) => {
      try {
        const { inventorySlotId, partySize, customerName, customerPhone } = req.body;
        const userId = req.user.userId;

        if (!inventorySlotId || !partySize) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const result = await prisma.$transaction(async (tx) => {
          // Get the inventory slot
          const inventorySlot = await tx.inventorySlot.findUnique({
            where: { id: inventorySlotId },
            include: {
              restaurant: true,
              timeSlot: true,
            },
          });

          if (!inventorySlot) {
            throw new Error("Inventory slot not found");
          }

          if (inventorySlot.availableCount <= 0) {
            throw new Error("No availability for this slot");
          }

          // Create reservation
          const reservation = await tx.reservation.create({
            data: {
              userId,
              restaurantId: inventorySlot.restaurantId,
              inventorySlotId,
              partySize,
              customerName: customerName || null,
              customerPhone: customerPhone || null,
              status: "confirmed",
            },
          });

          // Decrease available count
          await tx.inventorySlot.update({
            where: { id: inventorySlotId },
            data: {
              availableCount: {
                decrement: 1,
              },
            },
          });

          return {
            reservation,
            restaurant: inventorySlot.restaurant,
            timeSlot: inventorySlot.timeSlot,
            date: inventorySlot.date,
          };
        });

        res.status(201).json(result);
      } catch (error) {
        console.error("❌ Create reservation error:", error);
        res.status(500).json({
          error: "Failed to create reservation",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // Get user's reservations
    app.get("/api/reservations", authenticateToken, async (req, res) => {
      try {
        const userId = req.user.userId;

        const reservations = await prisma.reservation.findMany({
          where: { userId },
          include: {
            restaurant: true,
            inventorySlot: {
              include: {
                timeSlot: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        res.json(reservations);
      } catch (error) {
        console.error("❌ Get reservations error:", error);
        res.status(500).json({ error: "Failed to fetch reservations" });
      }
    });

    // Import admin routes
    try {
      const { default: adminRoutes } = await import("./routes/admin");
      app.use("/api/admin", adminRoutes);
    } catch (error) {
      console.error("❌ Failed to load admin routes:", error);
    }

    // Import auth routes
    try {
      const { default: authRoutes } = await import("./routes/auth");
      app.use("/api/auth", authRoutes);
    } catch (error) {
      console.error("❌ Failed to load auth routes:", error);
    }

    // (Optional SPA fallback – make sure it doesn't shadow "/")
    if (isProd) {
      const webDistPath = path.join(process.cwd(), "../..", "web", "dist");
      app.use(express.static(webDistPath, { index: false }));
      app.get(/^\/(?!api\/)(?!$)(?!health$)(?!ready$).*/, (_req, res) => {
        res.sendFile(path.join(webDistPath, "index.html"));
      });
    }

    // Global error logging (don't exit in prod)
    process.on("unhandledRejection", (r) => console.error("[API] UNHANDLED REJECTION:", r));
    process.on("uncaughtException", (e) => console.error("[API] UNCAUGHT EXCEPTION:", e));

    console.log("[API] Bootstrap complete.");
  } catch (e) {
    console.error("[API] Bootstrap failed:", e);
    // DO NOT exit here; keep serving health checks
  }
});
