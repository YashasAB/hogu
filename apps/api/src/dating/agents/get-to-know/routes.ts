import { Router } from "express";
import prisma from "../../../prismaClient";
import { datingSessionMiddleware } from "../../session";
import { runGetToKnow, runGetToKnowStart, getGetToKnowStatus, GetToKnowLimitError } from "./index";

const router = Router();

router.get("/messages", datingSessionMiddleware, async (req: any, res: any) => {
  try {
    const userId = (req as any).datingUserId as string | null;
    if (!userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
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
    const userId = (req as any).datingUserId as string | null;
    if (!userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
    const status = await getGetToKnowStatus(userId);
    res.json(status);
  } catch (err) {
    console.error("[GetToKnow] /status error:", err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

router.post("/start", datingSessionMiddleware, async (req: any, res: any) => {
  try {
    const userId = (req as any).datingUserId as string | null;
    if (!userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
    const result = await runGetToKnowStart(userId);
    res.json({ reply: result.reply });
  } catch (err) {
    console.error("[GetToKnow] /start error:", err);
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

router.post("/chat", datingSessionMiddleware, async (req: any, res: any) => {
  try {
    const userId = (req as any).datingUserId as string | null;
    if (!userId) return res.status(401).json({ ok: false, error: "Not authenticated" });
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
