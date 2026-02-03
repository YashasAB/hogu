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

      const hash = await hashPassword(data.password);
      const user = await prisma.datingUser.create({
        data: {
          phoneE164: data.phoneE164,
          passwordHash: hash,
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
          height: data.height,
        },
        select: { id: true, name: true, phoneE164: true },
      });

      // Save photos
      await Promise.all(
        data.photos.map((p: { objectKey: string; sortOrder: number }) =>
          prisma.datingUserPhoto.create({
            data: {
              userId: user.id,
              objectKey: p.objectKey,
              sortOrder: p.sortOrder ?? 0,
            },
            select: { id: true },
          })
        )
      );

      // Save cuisines (lookup by value, create junction records)
      if (data.cuisines && data.cuisines.length > 0) {
        const cuisineOptions = await prisma.cuisineOption.findMany({
          where: { value: { in: data.cuisines } },
          select: { id: true },
        });
        await Promise.all(
          cuisineOptions.map((opt) =>
            prisma.datingUserCuisine.create({
              data: { userId: user.id, cuisineOptionId: opt.id },
            })
          )
        );
      }

      // Save first date types (lookup by value, create junction records)
      if (data.firstDateTypes && data.firstDateTypes.length > 0) {
        const firstDateOptions = await prisma.firstDateTypeOption.findMany({
          where: { value: { in: data.firstDateTypes } },
          select: { id: true },
        });
        await Promise.all(
          firstDateOptions.map((opt) =>
            prisma.datingUserFirstDateType.create({
              data: { userId: user.id, firstDateTypeOptionId: opt.id },
            })
          )
        );
      }

      // Save interests (free-form tags)
      if (data.interests && data.interests.length > 0) {
        await Promise.all(
          data.interests.map((tag: string) =>
            prisma.datingUserInterest.create({
              data: { userId: user.id, tag },
            })
          )
        );
      }

      // Save languages (free-form)
      if (data.languages && data.languages.length > 0) {
        await Promise.all(
          data.languages.map((lang: string) =>
            prisma.datingUserLanguage.create({
              data: { userId: user.id, lang },
            })
          )
        );
      }

      setSessionCookie(res, user.id);
      return res.status(201).json({ ok: true, user: { id: user.id, name: user.name, phoneE164: user.phoneE164 } });
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
    return res.status(200).json({ ok: true, user: { id: user.id, name: user.name, phoneE164: user.phoneE164 } });
  },

  async logout(_req: any, res: any) {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  },
};
