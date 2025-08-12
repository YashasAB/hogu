"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    fullName: zod_1.z.string().optional()
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
router.post('/register', async (req, res) => {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { email, fullName } = parse.data;
    // Mock response without database
    const user = { id: '1', email, fullName };
    const token = 'mock-jwt-token';
    res.json({ token, user });
});
router.post('/login', async (req, res) => {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: parse.error.flatten() });
    const { email } = parse.data;
    // Mock response without database
    const user = { id: '1', email, fullName: 'Demo User' };
    const token = 'mock-jwt-token';
    res.json({ token, user });
});
exports.default = router;
