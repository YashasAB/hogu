import { Router } from "express";
import { AuthController } from "./controller";
import { datingSessionMiddleware } from "../session";
import { sendOtp, checkOtp } from "./otp";
import prisma from "../../prismaClient";

const router = Router();

router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.post("/reset-password", AuthController.resetPassword);
router.get("/me", datingSessionMiddleware, AuthController.me);
router.post("/logout", datingSessionMiddleware, AuthController.logout);

router.post("/send-otp", async (req: any, res: any) => {
  const phone = (req.body?.phone || "").toString().trim();
  if (!phone) {
    return res.status(400).json({ ok: false, error: "Phone number required." });
  }
  try {
    await sendOtp(phone);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("[send-otp]", err?.message);
    return res.status(500).json({ ok: false, error: "Failed to send code. Please try again." });
  }
});

router.post("/verify-otp", async (req: any, res: any) => {
  const phone = (req.body?.phone || "").toString().trim();
  const code = (req.body?.code || "").toString().trim();
  if (!phone || !code) {
    return res.status(400).json({ ok: false, error: "Phone and code required." });
  }
  try {
    const valid = await checkOtp(phone, code);
    if (!valid) {
      return res.status(400).json({ ok: false, error: "Invalid or expired code. Please try again." });
    }
    await prisma.phoneVerified.upsert({
      where: { phone },
      create: { phone, verifiedAt: new Date() },
      update: { verifiedAt: new Date() },
    });
    return res.json({ ok: true });
  } catch (err: any) {
    console.error("[verify-otp]", err?.message);
    return res.status(500).json({ ok: false, error: "Verification failed. Please try again." });
  }
});

export default router;
