import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  authenticateRestaurant,
  AuthenticatedRestaurantRequest,
} from "../middleware/auth";
import mime from "mime-types";
import { Client } from "@replit/object-storage";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";

const router = Router();
const prisma = new PrismaClient();

// Initialize Replit Object Storage client
const storageClient = new Client();

// Initialize S3 client only if AWS credentials are available
let s3Client: S3Client | null = null;
const hasAWSCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET_NAME;

if (hasAWSCredentials) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

// Multer configuration for file uploads (use memory storage for buffer access)
const upload = multer({ storage: multer.memoryStorage() });

// Get restaurant profile
router.get(
  "/restaurant",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      console.log("Fetching restaurant profile for ID:", restaurantId);
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        console.error("Restaurant not found for ID:", restaurantId);
        return res.status(404).json({ error: "Restaurant not found" });
      }

      console.log("Successfully fetched restaurant profile:", restaurant.name);
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ error: "Failed to fetch restaurant" });
    }
  },
);

// Update restaurant profile
router.put(
  "/restaurant",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const { name, neighborhood, instagramUrl, website, heroImageUrl } =
        req.body;
      console.log(
        "Updating restaurant profile for ID:",
        restaurantId,
        "with data:",
        req.body,
      );

      const restaurant = await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          name,
          neighborhood,
          instagramUrl,
          website,
          heroImageUrl,
        },
      });

      console.log("Successfully updated restaurant profile:", restaurant.name);
      res.json(restaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).json({ error: "Failed to update restaurant" });
    }
  },
);

// Helper to extract the object-storage key from any previously stored URL
function extractObjectKeyFromUrl(url: string): string | null {
  // Your proxy URL: /api/images/storage/<restaurantId>/<file>
  const m1 = url.match(/\/api\/images\/storage\/([^?]+)/);
  if (m1) return decodeURIComponent(m1[1]);

  // GCS-like path: .../o/<encodedKey>?alt=media
  const m2 = url.match(/\/o\/([^?]+)/);
  if (m2) return decodeURIComponent(m2[1]);

  // Legacy: storage.replit.com/<REPL_ID>/<key>
  const m3 = url.match(/storage\.replit\.com\/[^/]+\/(.+)/);
  if (m3) return decodeURIComponent(m3[1]);

  return null;
}

// Upload hero image for a restaurant
router.post(
  "/restaurant/hero-image",
  authenticateRestaurant,
  upload.single("heroImage") as any,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Accept only images
      if (!file.mimetype.startsWith("image/")) {
        return res
          .status(400)
          .json({ error: "Only image uploads are allowed" });
      }

      console.log(`Uploading hero image for restaurant ID: ${restaurantId}`);
      console.log(
        `File details - name: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`,
      );

      // Normalize extension from the MIME type first; fall back to original name
      const extFromName = (
        file.originalname.split(".").pop() || ""
      ).toLowerCase();
      const ext = extFromName || "jpg";

      // Final key in object storage
      const objectKey = `${restaurantId}/heroImage.${ext}`;

      // Ensure we have a client each request (avoids "client not initialized")
      const { Client } = await import("@replit/object-storage");
      const storageClient = new Client();

      // Delete any existing image first (regardless of URL format previously stored)
      const existing = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { heroImageUrl: true },
      });

      if (existing?.heroImageUrl) {
        const oldKey = extractObjectKeyFromUrl(existing.heroImageUrl);
        if (oldKey) {
          try {
            const del = await storageClient.delete(oldKey);
            if (!del.ok) {
              console.warn("⚠️ Failed to delete old hero image:", del.error);
            } else {
              console.log("✅ Deleted old hero image:", oldKey);
            }
          } catch (e) {
            console.warn("⚠️ Error deleting old hero image:", e);
          }
        }
      }

      // Multer gives Buffer already → use it
      const buf: Buffer = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer as ArrayBufferLike);

      // Optional options if supported by your SDK version
      const upload = await storageClient.uploadFromBytes(objectKey, buf, {});

      if (!upload.ok) {
        const msg =
          (upload as any).error?.message || JSON.stringify(upload.error);
        return res.status(500).json({ error: `Storage upload failed: ${msg}` });
      }

      // Store the canonical PROXY URL (your API will serve correct image bytes & headers)
      const proxyUrl = `/api/images/storage/${restaurantId}/heroImage.${ext}`;

      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { heroImageUrl: proxyUrl },
      });

      console.log(
        `✅ Hero image uploaded successfully for ${restaurantId}: ${proxyUrl}`,
      );

      return res.json({
        message: "Hero image uploaded successfully",
        imageUrl: proxyUrl,
      });
    } catch (err) {
      console.error("Error uploading hero image:", err);
      return res.status(500).json({ error: "Failed to upload hero image" });
    }
  },
);

// Get slots for a date
router.get(
  "/slots",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const { date } = req.query;
      console.log(
        `Fetching slots for restaurant ID: ${restaurantId} on date: ${date}`,
      );

      if (!date) {
        console.error("Date is required for fetching slots");
        return res.status(400).json({ error: "Date is required" });
      }

      const slots = await prisma.timeSlot.findMany({
        where: {
          restaurantId: restaurantId,
          date: date as string,
        },
        include: {
          reservations: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          time: "asc",
        },
      });

      console.log(
        `Found ${slots.length} slots for restaurant ID: ${restaurantId} on date: ${date}`,
      );

      const formattedSlots = slots.map((slot) => ({
        id: slot.id,
        date: slot.date,
        time: slot.time,
        capacity: slot.partySize,
        status: slot.status.toLowerCase(),
        bookingId:
          slot.reservations.length > 0 ? slot.reservations[0].id : null,
      }));

      res.json(formattedSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      res.status(500).json({ error: "Failed to fetch slots" });
    }
  },
);

// Get all upcoming bookings for the restaurant (pending/confirmed from today onwards)
router.get(
  "/bookings",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      console.log(
        "Fetching upcoming bookings for restaurant ID:",
        restaurantId,
      );

      const today = new Date().toISOString().split("T")[0];
      console.log("Today date for filtering:", today);

      // First, let's check if there are ANY reservations for this restaurant
      const allBookingsForRestaurant = await prisma.reservation.findMany({
        where: { restaurantId: restaurantId },
        include: {
          slot: { select: { date: true, time: true } },
          user: { select: { name: true, email: true } },
        },
      });
      console.log(
        "ALL bookings for this restaurant:",
        allBookingsForRestaurant.length,
      );
      console.log(
        "All bookings details:",
        allBookingsForRestaurant.map((b) => ({
          id: b.id,
          status: b.status,
          date: b.slot.date,
          time: b.slot.time,
          user: b.user.name || b.user.email,
          restaurantId: b.restaurantId,
        })),
      );

      // Also check what restaurants exist
      const allRestaurants = await prisma.restaurant.findMany({
        select: { id: true, name: true },
      });
      console.log("All restaurants in database:", allRestaurants);

      // Fetch upcoming bookings (excluding completed/cancelled)
      const bookings = await prisma.reservation.findMany({
        where: {
          restaurantId: restaurantId,
          status: {
            in: ["PENDING", "CONFIRMED", "HELD", "SEATED"],
          },
          slot: {
            date: {
              gte: today,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          slot: {
            select: {
              date: true,
              time: true,
              partySize: true,
            },
          },
        },
        orderBy: [{ slot: { date: "asc" } }, { slot: { time: "asc" } }],
      });

      console.log("Raw bookings found:", bookings.length);
      console.log(
        "Bookings details:",
        bookings.map((b) => ({
          id: b.id,
          restaurantId: b.restaurantId,
          status: b.status,
          date: b.slot.date,
        })),
      );

      // Fetch all bookings for today to calculate live status
      const todayBookings = await prisma.reservation.findMany({
        where: {
          restaurantId: restaurantId,
          slot: {
            date: today,
          },
        },
        select: {
          status: true,
        },
      });

      // Calculate live status from today's bookings
      const liveStatus = {
        pending: todayBookings.filter(
          (b) => b.status === "PENDING" || b.status === "HELD",
        ).length,
        confirmed: todayBookings.filter(
          (b) => b.status === "CONFIRMED" || b.status === "SEATED",
        ).length,
        completed: todayBookings.filter((b) => b.status === "COMPLETED").length,
      };

      // Transform to match frontend format
      const formattedBookings = bookings.map((booking) => ({
        id: booking.id,
        slotId: booking.slotId,
        partySize: booking.partySize,
        status: booking.status,
        createdAt: booking.createdAt.toISOString(),
        user: {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone,
        },
        slot: {
          date: booking.slot.date,
          time: booking.slot.time,
          partySize: booking.slot.partySize,
        },
      }));

      console.log("Live status calculated:", liveStatus);
      console.log(
        "Successfully fetched upcoming bookings:",
        formattedBookings.length,
        "bookings found",
      );

      // Return both bookings and live status
      res.json({
        bookings: formattedBookings,
        liveStatus: liveStatus,
      });
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  },
);

// Add multiple slots
router.post(
  "/slots/bulk",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const { date, start, end, interval, capacity } = req.body;
      console.log(
        `Creating slots for restaurant ID: ${restaurantId} on date: ${date} from ${start} to ${end} with interval ${interval} and capacity ${capacity}`,
      );

      const [startHour, startMin] = start.split(":").map(Number);
      const [endHour, endMin] = end.split(":").map(Number);

      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      const slots = [];
      for (let time = startTime; time < endTime; time += interval) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

        slots.push({
          restaurantId: restaurantId,
          date,
          time: timeString,
          partySize: capacity,
          status: "AVAILABLE",
        });
      }

      const createdSlots = await prisma.timeSlot.createMany({
        data: slots,
      });

      console.log(
        `Created ${createdSlots.count} slots for restaurant ID: ${restaurantId} on date: ${date}`,
      );
      res.json({ created: createdSlots.count });
    } catch (error) {
      console.error("Error creating slots:", error);
      res.status(500).json({ error: "Failed to create slots" });
    }
  },
);

// Update slot status
router.patch(
  "/slots/:id",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const { id } = req.params;
      const { status } = req.body;
      console.log(
        `Updating slot ID: ${id} for restaurant ID: ${restaurantId} with status: ${status}`,
      );

      const slot = await prisma.timeSlot.update({
        where: {
          id,
          restaurantId: restaurantId,
        },
        data: {
          status: status.toUpperCase(),
        },
      });

      console.log(
        `Successfully updated slot ID: ${id} to status: ${slot.status}`,
      );
      res.json(slot);
    } catch (error) {
      console.error("Error updating slot:", error);
      res.status(500).json({ error: "Failed to update slot" });
    }
  },
);

// Update booking status
router.patch(
  "/bookings/:id",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const { id } = req.params;
      const { status } = req.body;
      const normalizedStatus = status.toUpperCase();
      console.log(
        `Updating booking ID: ${id} for restaurant ID: ${restaurantId} to status: ${normalizedStatus}`,
      );

      const result = await prisma.$transaction(async (prisma) => {
        const booking = await prisma.reservation.update({
          where: {
            id,
            restaurantId: restaurantId,
          },
          data: {
            status: normalizedStatus,
            confirmedAt:
              normalizedStatus === "CONFIRMED" ? new Date() : undefined,
          },
          include: {
            slot: true,
          },
        });

        if (normalizedStatus === "CONFIRMED") {
          await prisma.timeSlot.update({
            where: {
              id: booking.slotId,
            },
            data: {
              status: "FULL",
            },
          });
        } else if (normalizedStatus === "CANCELLED") {
          await prisma.timeSlot.update({
            where: {
              id: booking.slotId,
            },
            data: {
              status: "AVAILABLE",
            },
          });
        }
        console.log(
          `Successfully updated booking ID: ${id} to status: ${normalizedStatus}`,
        );
        return booking;
      });

      res.json(result);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  },
);

// Accept a booking request
router.post(
  "/bookings/:id/accept",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const reservationId = req.params.id;
      console.log(
        `Restaurant ${restaurantId} accepting booking ${reservationId}`,
      );

      // First verify the reservation belongs to this restaurant and is pending
      const reservation = await prisma.reservation.findFirst({
        where: {
          id: reservationId,
          restaurantId: restaurantId,
          status: "PENDING",
        },
      });

      if (!reservation) {
        console.log(
          `Reservation ${reservationId} not found or not pending for restaurant ${restaurantId}`,
        );
        return res
          .status(404)
          .json({ error: "Reservation not found or already processed" });
      }

      // Update the reservation status to CONFIRMED and slot status to FULL in a transaction
      const updatedReservation = await prisma.$transaction(async (tx) => {
        // Update the reservation status to CONFIRMED
        const confirmedReservation = await tx.reservation.update({
          where: { id: reservationId },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
          },
          include: {
            user: { select: { name: true, email: true } },
            slot: { select: { date: true, time: true } },
          },
        });

        // Update the time slot status to FULL
        await tx.timeSlot.update({
          where: { id: reservation.slotId },
          data: { status: "FULL" },
        });

        return confirmedReservation;
      });

      console.log(`Successfully accepted reservation ${reservationId}`);
      res.json({
        message: "Booking accepted successfully",
        reservation: updatedReservation,
      });
    } catch (error) {
      console.error("Error accepting booking:", error);
      res.status(500).json({ error: "Failed to accept booking" });
    }
  },
);

// Reject a booking request
router.post(
  "/bookings/:id/reject",
  authenticateRestaurant,
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const restaurantId = req.restaurantId!;
      const reservationId = req.params.id;
      console.log(
        `Restaurant ${restaurantId} rejecting booking ${reservationId}`,
      );

      // First verify the reservation belongs to this restaurant and is pending
      const reservation = await prisma.reservation.findFirst({
        where: {
          id: reservationId,
          restaurantId: restaurantId,
          status: "PENDING",
        },
      });

      if (!reservation) {
        console.log(
          `Reservation ${reservationId} not found or not pending for restaurant ${restaurantId}`,
        );
        return res
          .status(404)
          .json({ error: "Reservation not found or already processed" });
      }

      // Update the reservation status to CANCELLED and slot status back to AVAILABLE in a transaction
      const updatedReservation = await prisma.$transaction(async (tx) => {
        // Update the reservation status to CANCELLED
        const cancelledReservation = await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "CANCELLED" },
          include: {
            user: { select: { name: true, email: true } },
            slot: { select: { date: true, time: true } },
          },
        });

        // Update the time slot status back to AVAILABLE
        await tx.timeSlot.update({
          where: { id: reservation.slotId },
          data: { status: "AVAILABLE" },
        });

        return cancelledReservation;
      });

      console.log(`Successfully rejected reservation ${reservationId}`);
      res.json({
        message: "Booking rejected successfully",
        reservation: updatedReservation,
      });
    } catch (error) {
      console.error("Error rejecting booking:", error);
      res.status(500).json({ error: "Failed to reject booking" });
    }
  },
);

router.post(
  "/api/images/storage/:restaurantId/hero-image",
  upload.single("image") as any,  // multer memory storage
  async (req: AuthenticatedRestaurantRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No image file provided" });
      if (!file.mimetype.startsWith("image/")) return res.status(400).json({ error: "Only image uploads are allowed" });

      const extMime = (mime.extension(file.mimetype) || "").toLowerCase();
      const extName = (file.originalname.split(".").pop() || "").toLowerCase();
      const ext = (extMime || extName || "jpg").replace("jpeg", "jpg");

      const objectKey = `${restaurantId}/heroImage.${ext}`;

      const { Client } = await import("@replit/object-storage");
      const storage = new Client();

      // Multer gives a Node Buffer already (binary)
      const buf: Buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer as ArrayBufferLike);

      // Upload as BYTES (never as text)
      const uploadRes = await (storage as any).uploadFromBytes(objectKey, buf /*, {
        contentType: file.mimetype,
        cacheControl: "public, max-age=31536000, immutable",
      }*/);

      if (!uploadRes?.ok) {
        const msg = uploadRes?.error?.message || JSON.stringify(uploadRes?.error) || "Unknown storage error";
        return res.status(500).json({ error: `Storage upload failed: ${msg}` });
      }

      const imageUrl = `/api/images/storage/${restaurantId}/heroImage.${ext}`;
      return res.json({ message: "Hero image uploaded successfully", imageUrl });
    } catch (err) {
      console.error("Error uploading hero image:", err);
      return res.status(500).json({ error: "Failed to upload hero image" });
    }
  }
);

export default router;
