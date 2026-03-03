"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../../../prismaClient"));
const session_1 = require("../../session");
const index_1 = require("./index");
const router = (0, express_1.Router)();
router.get("/messages", session_1.datingSessionMiddleware, async (req, res) => {
    try {
        const userId = req.datingUser.id;
        const messages = await prismaClient_1.default.getToKnowMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            take: 30,
            select: { id: true, role: true, content: true, createdAt: true },
        });
        res.json(messages);
    }
    catch (err) {
        console.error("[GetToKnow] /messages error:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});
router.get("/status", session_1.datingSessionMiddleware, async (req, res) => {
    try {
        const userId = req.datingUser.id;
        const status = await (0, index_1.getGetToKnowStatus)(userId);
        res.json(status);
    }
    catch (err) {
        console.error("[GetToKnow] /status error:", err);
        res.status(500).json({ error: "Failed to fetch status" });
    }
});
router.post("/chat", session_1.datingSessionMiddleware, async (req, res) => {
    try {
        const userId = req.datingUser.id;
        const { message } = req.body;
        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return res.status(400).json({ error: "Message is required" });
        }
        const result = await (0, index_1.runGetToKnow)(userId, message.trim());
        res.json({ reply: result.reply, dailyRemaining: result.dailyRemaining });
    }
    catch (err) {
        if (err instanceof index_1.GetToKnowLimitError) {
            return res.status(429).json({ error: "Daily limit reached", dailyRemaining: 0 });
        }
        console.error("[GetToKnow] /chat error:", err);
        res.status(500).json({ error: "Failed to process message" });
    }
});
exports.default = router;
