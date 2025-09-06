import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../password.js";
import { setSessionCookie, clearSessionCookie } from "../session.js";
import { requireLoginBody, requireSignupBody } from "./validators.js";

const prisma = new PrismaClient();

export const AuthController = {
  async signup(req, res, next) {
    try {
      const data = requireSignupBody(req.body);
      const exists = await prisma.datingUser.findFirst({
        where: { phoneE164: data.phoneE164 },
        select: { id: true },
      });
      if (exists)
        return res
          .status(409)
          .json({ ok: false, error: "Phone already registered" });

      const passwordHash = await hashPassword(data.password);
      const user = await prisma.datingUser.create({
        data: {
          phoneE164: data.phoneE164,
          passwordHash,
          name: data.name,
          dob: new Date(data.dob),

          profession: data.profession,
          dreams: data.dreams,
          fiveYearGoal: data.fiveYearGoal,
          whatIWantInPartner: data.whatIWantInPartner,
          whyPartnerWouldLikeMe: data.whyPartnerWouldLikeMe,

          physicalActivity: data.physicalActivity,
          dateBudget: data.dateBudget,
          instagramHandle: data.instagramHandle,
          diet: data.diet,
          drinking: data.drinking,
          smoking: data.smoking,
        },
        select: { id: true, name: true, phoneE164: true },
      });

      setSessionCookie(res, user.id);
      return res.status(201).json({ ok: true, user });
    } catch (err) {
      if (err && err.details)
        return res
          .status(err.status || 400)
          .json({ ok: false, error: "VALIDATION", details: err.details });
      return next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { phoneE164, password } = requireLoginBody(req.body);
      const user = await prisma.datingUser.findFirst({
        where: { phoneE164 },
        select: { id: true, name: true, phoneE164: true, passwordHash: true },
      });
      if (!user)
        return res
          .status(401)
          .json({ ok: false, error: "Invalid credentials" });

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid)
        return res
          .status(401)
          .json({ ok: false, error: "Invalid credentials" });

      setSessionCookie(res, user.id);
      return res
        .status(200)
        .json({
          ok: true,
          user: { id: user.id, name: user.name, phoneE164: user.phoneE164 },
        });
    } catch (err) {
      return next(err);
    }
  },

  async me(req, res) {
    const userId = req.datingUserId || null;
    if (!userId)
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    const user = await prisma.datingUser.findFirst({
      where: { id: userId },
      select: { id: true, name: true, phoneE164: true },
    });
    if (!user)
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    return res.status(200).json({ ok: true, user });
  },

  async logout(_req, res) {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  },
};
