"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const session_1 = require("../session");
const otp_1 = require("./otp");
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const router = (0, express_1.Router)();
router.post("/signup", controller_1.AuthController.signup);
router.post("/login", controller_1.AuthController.login);
router.post("/reset-password", controller_1.AuthController.resetPassword);
router.get("/me", session_1.datingSessionMiddleware, controller_1.AuthController.me);
router.post("/logout", session_1.datingSessionMiddleware, controller_1.AuthController.logout);
router.post("/send-otp", async (req, res) => {
    const phone = (req.body?.phone || "").toString().trim();
    if (!phone) {
        return res.status(400).json({ ok: false, error: "Phone number required." });
    }
    try {
        await (0, otp_1.sendOtp)(phone);
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("[send-otp]", err?.message);
        return res.status(500).json({ ok: false, error: "Failed to send code. Please try again." });
    }
});
router.post("/verify-otp", async (req, res) => {
    const phone = (req.body?.phone || "").toString().trim();
    const code = (req.body?.code || "").toString().trim();
    if (!phone || !code) {
        return res.status(400).json({ ok: false, error: "Phone and code required." });
    }
    try {
        const valid = await (0, otp_1.checkOtp)(phone, code);
        if (!valid) {
            return res.status(400).json({ ok: false, error: "Invalid or expired code. Please try again." });
        }
        await prismaClient_1.default.phoneVerified.upsert({
            where: { phone },
            create: { phone, verifiedAt: new Date() },
            update: { verifiedAt: new Date() },
        });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("[verify-otp]", err?.message);
        return res.status(500).json({ ok: false, error: "Verification failed. Please try again." });
    }
});
exports.default = router;
