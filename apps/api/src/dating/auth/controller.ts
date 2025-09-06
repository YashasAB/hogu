import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../password";
import { setSessionCookie, clearSessionCookie } from "../session";
import { requireLoginBody, requireSignupBody } from "./validators";

const prisma = new PrismaClient();

export const AuthController = {
  async signup(req: any, res: any, next: any) {
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
      if ((err as any).details)
        return res
          .status((err as any).status || 400)
          .json({
            ok: false,
            error: "VALIDATION",
            details: (err as any).details,
          });
      return next(err);
    }
  },

  async login(req: any, res: any, next: any) {
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

  async me(req: any, res: any) {
    const userId = (req as any).datingUserId as string | null;
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

  async logout(_req: any, res: any) {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  },
};
