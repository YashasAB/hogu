import prisma, { withRetry } from "../../prismaClient";
import { hashPassword, verifyPassword } from "../password";
import { setSessionCookie, clearSessionCookie, makeSessionValue } from "../session";
import { requireLoginBody, requireSignupBody } from "./validators";
import { checkOtp } from "./otp";


const PASSWORD_RESET_TOKEN = process.env.PASSWORD_RESET_TOKEN;

const LIFESTYLE_CANONICAL: Record<string, Record<string, string>> = {
  diet: { vegetarian: "VEG", veg: "VEG", eggetarian: "EGG", egg: "EGG", non_vegetarian: "NON_VEG", nonvegetarian: "NON_VEG", "non-vegetarian": "NON_VEG", vegan: "VEGAN", jain: "JAIN" },
  drinking: { never: "NEVER", socially: "SOCIALLY", occasionally: "SOCIALLY", regularly: "OFTEN", often: "OFTEN" },
  smoking: { no: "NO", never: "NO", socially: "SOCIALLY", occasionally: "SOCIALLY", yes: "YES", regularly: "YES" },
  physicalActivity: { rarely: "RARELY", sedentary: "RARELY", light: "RARELY", sometimes: "SOMETIMES", moderate: "SOMETIMES", regular: "REGULAR", active: "REGULAR", very_active: "REGULAR", athlete: "ATHLETE" },
};
function normalizeLifestyle(field: string, val: string | undefined | null): string | undefined | null {
  if (!val) return val;
  const map = LIFESTYLE_CANONICAL[field];
  if (!map) return val;
  return map[val.toLowerCase()] || val;
}

export const AuthController = {
  async signup(req: any, res: any, next: any) {
    try {
      const data = requireSignupBody(req.body);

      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const verified = await prisma.phoneVerified.findFirst({
        where: {
          phone: data.phoneE164,
          verifiedAt: { gte: thirtyMinsAgo },
        },
        select: { phone: true },
      });
      if (!verified) {
        return res.status(403).json({
          ok: false,
          error: "Phone verification required. Please verify your phone number before signing up.",
        });
      }

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
          myDayLooksLike: data.myDayLooksLike,
          idealFirstDate: data.idealFirstDate,
          nonNegotiables: data.nonNegotiables,

          physicalActivity: normalizeLifestyle("physicalActivity", data.physicalActivity) as string | undefined,
          dateBudget: data.dateBudget,
          instagramHandle: data.instagramHandle,
          diet: normalizeLifestyle("diet", data.diet) as string | undefined,
          drinking: normalizeLifestyle("drinking", data.drinking) as string | undefined,
          smoking: normalizeLifestyle("smoking", data.smoking) as string | undefined,
          height: data.height,
          gender: data.gender,
          relationshipType: data.relationshipType,
          agePreferenceMin: data.agePreferenceMin,
          agePreferenceMax: data.agePreferenceMax,
          dateCity: data.dateCity,
          dateNeighborhoods: data.dateNeighborhoods,
          city: data.city,
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

      // Check if profile essays are incomplete and auto-message user
      const hasIncompleteProfile = 
        !data.dreams || data.dreams.trim().length < 20 ||
        !data.fiveYearGoal || data.fiveYearGoal.trim().length < 20 ||
        !data.whatIWantInPartner || data.whatIWantInPartner.trim().length < 20 ||
        !data.whyPartnerWouldLikeMe || data.whyPartnerWouldLikeMe.trim().length < 20 ||
        !data.myDayLooksLike || data.myDayLooksLike.trim().length < 20 ||
        !data.idealFirstDate || data.idealFirstDate.trim().length < 20 ||
        !data.nonNegotiables || data.nonNegotiables.trim().length < 20;

      if (hasIncompleteProfile) {
        await prisma.adminMessage.create({
          data: {
            userId: user.id,
            fromAdmin: true,
            content: `Hey ${user.name}! Welcome to Hogu! 🎉

The best way to help us find your perfect match is to talk to your matchmaker and tell them more about yourself — the more we know, the better your matches.

Head to your Matches section and tap "Chat with your live matchmaker" to get started. Just tell them about yourself in your own words and we'll take it from there.

Your matchmaker`,
            read: false,
          },
        });
      }

      await prisma.phoneVerified.deleteMany({ where: { phone: data.phoneE164 } }).catch(() => {});

      setSessionCookie(req, res, user.id);
      return res.status(201).json({ ok: true, sessionToken: makeSessionValue(user.id), user: { id: user.id, name: user.name, phoneE164: user.phoneE164 } });
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
      const { phoneE164, password, otp } = requireLoginBody(req.body);
      const digits10 = phoneE164.replace(/\D/g, "").slice(-10);
      const user = await withRetry(() =>
        prisma.datingUser.findFirst({
          where: { phoneE164: { endsWith: digits10 } },
          select: { id: true, name: true, phoneE164: true, passwordHash: true },
        })
      );
      if (!user)
        return res
          .status(401)
          .json({ ok: false, error: "Invalid credentials" });

      if (password) {
        const valid = await verifyPassword(password, user.passwordHash);
        if (valid) {
          setSessionCookie(req, res, user.id);
          return res.status(200).json({
            ok: true,
            sessionToken: makeSessionValue(user.id),
            user: { id: user.id, name: user.name, phoneE164: user.phoneE164 },
          });
        }
        return res.status(401).json({ ok: false, error: "Incorrect password. Try again or use a one-time code." });
      }

      if (otp) {
        const valid = await checkOtp(phoneE164, otp);
        if (valid) {
          setSessionCookie(req, res, user.id);
          return res.status(200).json({
            ok: true,
            sessionToken: makeSessionValue(user.id),
            user: { id: user.id, name: user.name, phoneE164: user.phoneE164 },
          });
        }
        return res.status(401).json({ ok: false, error: "Invalid or expired code. Please try again." });
      }

      return res.status(401).json({ ok: false, error: "Please enter your password or use a one-time code." });
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

  async logout(req: any, res: any) {
    clearSessionCookie(req, res);
    return res.status(200).json({ ok: true });
  },

  async resetPassword(req: any, res: any, next: any) {
    try {
      const { phone, resetToken, newPassword } = req.body;

      if (!phone || !resetToken || !newPassword) {
        return res.status(400).json({ ok: false, error: "Phone number, reset token, and new password are required" });
      }

      if (!PASSWORD_RESET_TOKEN) {
        return res.status(503).json({ ok: false, error: "Password reset is not configured" });
      }

      if (resetToken !== PASSWORD_RESET_TOKEN) {
        return res.status(403).json({ ok: false, error: "Invalid reset token. Please contact your matchmaker for the correct token." });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ ok: false, error: "New password must be at least 8 characters" });
      }

      const phoneE164 = phone.startsWith("+") ? phone : `+${phone}`;
      const user = await prisma.datingUser.findFirst({
        where: { phoneE164 },
        select: { id: true, name: true },
      });

      if (!user) {
        return res.status(404).json({ ok: false, error: "No account found with this phone number" });
      }

      const hash = await hashPassword(newPassword);
      await prisma.datingUser.update({
        where: { id: user.id },
        data: { passwordHash: hash },
      });

      return res.status(200).json({ ok: true, message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (err) {
      return next(err);
    }
  },
};
