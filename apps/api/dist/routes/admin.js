"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const object_storage_1 = require("@replit/object-storage");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Initialize Replit Object Storage client
const storageClient = new object_storage_1.Client();
// Initialize S3 client only if AWS credentials are available
let s3Client = null;
const hasAWSCredentials = process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME;
if (hasAWSCredentials) {
    s3Client = new client_s3_1.S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
}
// Multer configuration for file uploads
const upload = (0, multer_1.default)({ storage: multer_1.default.diskStorage({}) });
// Get restaurant profile
router.get('/restaurant', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        console.log('Fetching restaurant profile for ID:', restaurantId);
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant) {
            console.error('Restaurant not found for ID:', restaurantId);
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        console.log('Successfully fetched restaurant profile:', restaurant.name);
        res.json(restaurant);
    }
    catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
});
// Update restaurant profile
router.put('/restaurant', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { name, neighborhood, instagramUrl, website, heroImageUrl } = req.body;
        console.log('Updating restaurant profile for ID:', restaurantId, 'with data:', req.body);
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
        console.log('Successfully updated restaurant profile:', restaurant.name);
        res.json(restaurant);
    }
    catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ error: 'Failed to update restaurant' });
    }
});
// Upload hero image for a restaurant
router.post('/restaurant/hero-image', auth_1.authenticateRestaurant, upload.single('heroImage'), async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        console.log(`Uploading hero image for restaurant ID: ${restaurantId}`);
        // Upload the file to Replit Object Storage
        const fileName = `${restaurantId}/heroImage.${file.originalname.split('.').pop()}`;
        const uploadResult = await storageClient.uploadFromBytes(fileName, file.buffer);
        if (!uploadResult.ok) {
            throw new Error('Failed to upload to storage');
        }
        // Construct the URL for the uploaded file
        const heroImageUrl = `https://storage.replit.com/${process.env.REPL_ID}/${fileName}`;
        console.log(`File uploaded successfully to: ${heroImageUrl}`);
        // Update the restaurant's heroImageUrl in the database
        const updatedRestaurant = await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { heroImageUrl },
        });
        console.log(`Updated restaurant ${restaurantId} with new hero image URL: ${heroImageUrl}`);
        res.json({ message: 'Hero image updated successfully', imageUrl: updatedRestaurant.heroImageUrl });
    }
    catch (error) {
        console.error('Error uploading hero image:', error);
        res.status(500).json({ error: 'Failed to upload hero image' });
    }
});
// Get slots for a date
router.get('/slots', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { date } = req.query;
        console.log(`Fetching slots for restaurant ID: ${restaurantId} on date: ${date}`);
        if (!date) {
            console.error('Date is required for fetching slots');
            return res.status(400).json({ error: 'Date is required' });
        }
        const slots = await prisma.timeSlot.findMany({
            where: {
                restaurantId: restaurantId,
                date: date,
            },
            include: {
                reservations: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: {
                time: 'asc',
            },
        });
        console.log(`Found ${slots.length} slots for restaurant ID: ${restaurantId} on date: ${date}`);
        const formattedSlots = slots.map(slot => ({
            id: slot.id,
            date: slot.date,
            time: slot.time,
            capacity: slot.partySize,
            status: slot.status.toLowerCase(),
            bookingId: slot.reservations.length > 0 ? slot.reservations[0].id : null,
        }));
        res.json(formattedSlots);
    }
    catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
});
// Get all upcoming bookings for the restaurant (pending/confirmed from today onwards)
router.get('/bookings', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        console.log('Fetching upcoming bookings for restaurant ID:', restaurantId);
        const today = new Date().toISOString().split('T')[0];
        console.log('Today date for filtering:', today);
        // First, let's check if there are ANY reservations for this restaurant
        const allBookingsForRestaurant = await prisma.reservation.findMany({
            where: { restaurantId: restaurantId },
            include: {
                slot: { select: { date: true, time: true } },
                user: { select: { name: true, email: true } }
            }
        });
        console.log('ALL bookings for this restaurant:', allBookingsForRestaurant.length);
        console.log('All bookings details:', allBookingsForRestaurant.map(b => ({
            id: b.id,
            status: b.status,
            date: b.slot.date,
            time: b.slot.time,
            user: b.user.name || b.user.email,
            restaurantId: b.restaurantId
        })));
        // Also check what restaurants exist
        const allRestaurants = await prisma.restaurant.findMany({
            select: { id: true, name: true }
        });
        console.log('All restaurants in database:', allRestaurants);
        // Fetch upcoming bookings (excluding completed/cancelled)
        const bookings = await prisma.reservation.findMany({
            where: {
                restaurantId: restaurantId,
                status: {
                    in: ['PENDING', 'CONFIRMED', 'HELD', 'SEATED']
                },
                slot: {
                    date: {
                        gte: today
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                slot: {
                    select: {
                        date: true,
                        time: true,
                        partySize: true
                    }
                }
            },
            orderBy: [
                { slot: { date: 'asc' } },
                { slot: { time: 'asc' } },
            ],
        });
        console.log('Raw bookings found:', bookings.length);
        console.log('Bookings details:', bookings.map(b => ({ id: b.id, restaurantId: b.restaurantId, status: b.status, date: b.slot.date })));
        // Fetch all bookings for today to calculate live status
        const todayBookings = await prisma.reservation.findMany({
            where: {
                restaurantId: restaurantId,
                slot: {
                    date: today
                }
            },
            select: {
                status: true
            }
        });
        // Calculate live status from today's bookings
        const liveStatus = {
            pending: todayBookings.filter(b => b.status === 'PENDING' || b.status === 'HELD').length,
            confirmed: todayBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'SEATED').length,
            completed: todayBookings.filter(b => b.status === 'COMPLETED').length,
        };
        // Transform to match frontend format
        const formattedBookings = bookings.map(booking => ({
            id: booking.id,
            slotId: booking.slotId,
            partySize: booking.partySize,
            status: booking.status,
            createdAt: booking.createdAt.toISOString(),
            user: {
                id: booking.user.id,
                name: booking.user.name,
                email: booking.user.email,
                phone: booking.user.phone
            },
            slot: {
                date: booking.slot.date,
                time: booking.slot.time,
                partySize: booking.slot.partySize
            }
        }));
        console.log('Live status calculated:', liveStatus);
        console.log('Successfully fetched upcoming bookings:', formattedBookings.length, 'bookings found');
        // Return both bookings and live status
        res.json({
            bookings: formattedBookings,
            liveStatus: liveStatus
        });
    }
    catch (error) {
        console.error('Error fetching upcoming bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});
// Add multiple slots
router.post('/slots/bulk', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { date, start, end, interval, capacity } = req.body;
        console.log(`Creating slots for restaurant ID: ${restaurantId} on date: ${date} from ${start} to ${end} with interval ${interval} and capacity ${capacity}`);
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        const slots = [];
        for (let time = startTime; time < endTime; time += interval) {
            const hour = Math.floor(time / 60);
            const minute = time % 60;
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push({
                restaurantId: restaurantId,
                date,
                time: timeString,
                partySize: capacity,
                status: 'AVAILABLE',
            });
        }
        const createdSlots = await prisma.timeSlot.createMany({
            data: slots,
        });
        console.log(`Created ${createdSlots.count} slots for restaurant ID: ${restaurantId} on date: ${date}`);
        res.json({ created: createdSlots.count });
    }
    catch (error) {
        console.error('Error creating slots:', error);
        res.status(500).json({ error: 'Failed to create slots' });
    }
});
// Update slot status
router.patch('/slots/:id', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { id } = req.params;
        const { status } = req.body;
        console.log(`Updating slot ID: ${id} for restaurant ID: ${restaurantId} with status: ${status}`);
        const slot = await prisma.timeSlot.update({
            where: {
                id,
                restaurantId: restaurantId,
            },
            data: {
                status: status.toUpperCase(),
            },
        });
        console.log(`Successfully updated slot ID: ${id} to status: ${slot.status}`);
        res.json(slot);
    }
    catch (error) {
        console.error('Error updating slot:', error);
        res.status(500).json({ error: 'Failed to update slot' });
    }
});
// Update booking status
router.patch('/bookings/:id', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const { id } = req.params;
        const { status } = req.body;
        const normalizedStatus = status.toUpperCase();
        console.log(`Updating booking ID: ${id} for restaurant ID: ${restaurantId} to status: ${normalizedStatus}`);
        const result = await prisma.$transaction(async (prisma) => {
            const booking = await prisma.reservation.update({
                where: {
                    id,
                    restaurantId: restaurantId,
                },
                data: {
                    status: normalizedStatus,
                    confirmedAt: normalizedStatus === 'CONFIRMED' ? new Date() : undefined,
                },
                include: {
                    slot: true,
                },
            });
            if (normalizedStatus === 'CONFIRMED') {
                await prisma.timeSlot.update({
                    where: {
                        id: booking.slotId,
                    },
                    data: {
                        status: 'FULL',
                    },
                });
            }
            else if (normalizedStatus === 'CANCELLED') {
                await prisma.timeSlot.update({
                    where: {
                        id: booking.slotId,
                    },
                    data: {
                        status: 'AVAILABLE',
                    },
                });
            }
            console.log(`Successfully updated booking ID: ${id} to status: ${normalizedStatus}`);
            return booking;
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: 'Failed to update booking' });
    }
});
// Accept a booking request
router.post('/bookings/:id/accept', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const reservationId = req.params.id;
        console.log(`Restaurant ${restaurantId} accepting booking ${reservationId}`);
        // First verify the reservation belongs to this restaurant and is pending
        const reservation = await prisma.reservation.findFirst({
            where: {
                id: reservationId,
                restaurantId: restaurantId,
                status: 'PENDING'
            }
        });
        if (!reservation) {
            console.log(`Reservation ${reservationId} not found or not pending for restaurant ${restaurantId}`);
            return res.status(404).json({ error: 'Reservation not found or already processed' });
        }
        // Update the reservation status to CONFIRMED and slot status to FULL in a transaction
        const updatedReservation = await prisma.$transaction(async (tx) => {
            // Update the reservation status to CONFIRMED
            const confirmedReservation = await tx.reservation.update({
                where: { id: reservationId },
                data: {
                    status: 'CONFIRMED',
                    confirmedAt: new Date()
                },
                include: {
                    user: { select: { name: true, email: true } },
                    slot: { select: { date: true, time: true } }
                }
            });
            // Update the time slot status to FULL
            await tx.timeSlot.update({
                where: { id: reservation.slotId },
                data: { status: 'FULL' }
            });
            return confirmedReservation;
        });
        console.log(`Successfully accepted reservation ${reservationId}`);
        res.json({
            message: 'Booking accepted successfully',
            reservation: updatedReservation
        });
    }
    catch (error) {
        console.error('Error accepting booking:', error);
        res.status(500).json({ error: 'Failed to accept booking' });
    }
});
// Reject a booking request
router.post('/bookings/:id/reject', auth_1.authenticateRestaurant, async (req, res) => {
    try {
        const restaurantId = req.restaurantId;
        const reservationId = req.params.id;
        console.log(`Restaurant ${restaurantId} rejecting booking ${reservationId}`);
        // First verify the reservation belongs to this restaurant and is pending
        const reservation = await prisma.reservation.findFirst({
            where: {
                id: reservationId,
                restaurantId: restaurantId,
                status: 'PENDING'
            }
        });
        if (!reservation) {
            console.log(`Reservation ${reservationId} not found or not pending for restaurant ${restaurantId}`);
            return res.status(404).json({ error: 'Reservation not found or already processed' });
        }
        // Update the reservation status to CANCELLED and slot status back to AVAILABLE in a transaction
        const updatedReservation = await prisma.$transaction(async (tx) => {
            // Update the reservation status to CANCELLED
            const cancelledReservation = await tx.reservation.update({
                where: { id: reservationId },
                data: { status: 'CANCELLED' },
                include: {
                    user: { select: { name: true, email: true } },
                    slot: { select: { date: true, time: true } }
                }
            });
            // Update the time slot status back to AVAILABLE
            await tx.timeSlot.update({
                where: { id: reservation.slotId },
                data: { status: 'AVAILABLE' }
            });
            return cancelledReservation;
        });
        console.log(`Successfully rejected reservation ${reservationId}`);
        res.json({
            message: 'Booking rejected successfully',
            reservation: updatedReservation
        });
    }
    catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).json({ error: 'Failed to reject booking' });
    }
});
// Upload photo to S3
router.post('/:restaurantId/hero-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }
    if (!s3Client || !hasAWSCredentials) {
        return res.status(503).json({
            error: 'S3 upload not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME environment variables.'
        });
    }
    try {
        const restaurantId = req.params.restaurantId;
        const fileName = `hero-images/${restaurantId}-${Date.now()}.jpg`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });
        await s3Client.send(command);
        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
        res.json({ imageUrl });
    }
    catch (error) {
        console.error('Error uploading to S3:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
// Generate presigned URL for S3 upload
router.post('/:restaurantId/photos/presign', async (req, res) => {
    if (!s3Client || !hasAWSCredentials) {
        return res.status(503).json({
            error: 'S3 upload not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME environment variables.'
        });
    }
    try {
        const restaurantId = req.params.restaurantId;
        const { fileName, contentType } = req.body;
        if (!fileName || !contentType) {
            return res.status(400).json({ error: 'fileName and contentType are required' });
        }
        const key = `photos/${restaurantId}/${Date.now()}-${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
        const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
        res.json({ uploadUrl, imageUrl });
    }
    catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});
exports.default = router;
