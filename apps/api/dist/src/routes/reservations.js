"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Mock availability data
const mockAvailability = [
    { id: '1', time: '18:00', partySize: 2, available: true },
    { id: '2', time: '18:30', partySize: 2, available: true },
    { id: '3', time: '19:00', partySize: 2, available: false },
    { id: '4', time: '19:30', partySize: 2, available: true },
    { id: '5', time: '20:00', partySize: 2, available: true },
    { id: '6', time: '20:30', partySize: 2, available: true }
];
router.get('/availability', async (req, res) => {
    const { restaurantId, date, partySize } = req.query;
    // Mock response
    res.json({
        restaurantId,
        date,
        partySize: parseInt(partySize),
        slots: mockAvailability
    });
});
const HoldSchema = zod_1.z.object({
    slotId: zod_1.z.string(),
    partySize: zod_1.z.number().min(1).max(10)
});
router.post('/hold', async (req, res) => {
    const parse = HoldSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { slotId, partySize } = parse.data;
    // Mock hold response
    res.json({
        id: 'mock-reservation-id',
        slotId,
        partySize,
        status: 'HELD',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
});
router.post('/:id/confirm', async (req, res) => {
    const { id } = req.params;
    // Mock confirmation
    res.json({
        id,
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString()
    });
});
exports.default = router;
