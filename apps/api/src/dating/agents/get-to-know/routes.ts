import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { datingSessionMiddleware } from "../../session";
import { runGetToKnow, getGetToKnowStatus, GetToKnowLimitError } from "./index";

const router = Router();
const prisma = new PrismaClient();

router.get("/messages", datingSessionMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.datingUser.id;
    const messages = await prisma.getToKnowMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 30,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    res.json(messages);
  } catch (err) {
    console.error("[GetToKnow] /messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/status", datingSessionMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.datingUser.id;
    const status = await getGetToKnowStatus(userId);
    res.json(status);
  } catch (err) {
    console.error("[GetToKnow] /status error:", err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

router.post("/chat", datingSessionMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.datingUser.id;
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await runGetToKnow(userId, message.trim());
    res.json({ reply: result.reply, dailyRemaining: result.dailyRemaining });
  } catch (err: any) {
    if (err instanceof GetToKnowLimitError) {
      return res.status(429).json({ error: "Daily limit reached", dailyRemaining: 0 });
    }
    console.error("[GetToKnow] /chat error:", err);
    res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;
