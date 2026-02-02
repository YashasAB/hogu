import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { datingSessionMiddleware } from "../session";

const prisma = new PrismaClient();
const router = Router();

router.get("/matches", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const matches = await prisma.datingMatch.findMany({
      where: {
        OR: [{ user1_id: userId }, { user2_id: userId }],
        status: "MATCHED",
      },
    });

    const matchedUserIds = matches.map((m) =>
      m.user1_id === userId ? m.user2_id : m.user1_id
    );

    const matchedUsers = await prisma.datingUser.findMany({
      where: { id: { in: matchedUserIds } },
      select: {
        id: true,
        name: true,
        profession: true,
        dob: true,
      },
    });

    const photos = await prisma.datingUserPhoto.findMany({
      where: { user_id: { in: matchedUserIds } },
      orderBy: { sort_order: "asc" },
    });

    const photosByUser = new Map<string, typeof photos>();
    photos.forEach((p) => {
      if (!photosByUser.has(p.user_id)) photosByUser.set(p.user_id, []);
      photosByUser.get(p.user_id)!.push(p);
    });

    const result = matchedUsers.map((u) => ({
      ...u,
      photos: (photosByUser.get(u.id) || []).map((p) => ({
        objectKey: p.object_key,
        sortOrder: p.sort_order,
      })),
      matchedAt: matches.find(
        (m) => m.user1_id === u.id || m.user2_id === u.id
      )?.created_at,
    }));

    return res.json({ ok: true, matches: result });
  } catch (err) {
    console.error("Error fetching matches:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch matches" });
  }
});

router.get("/me", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const user = await prisma.datingUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone_e164: true,
        dob: true,
        profession: true,
        dreams: true,
        five_year_goal: true,
        what_i_want_in_partner: true,
        why_partner_would_like_me: true,
        physical_activity: true,
        date_budget: true,
        instagram_handle: true,
        diet: true,
        drinking: true,
        smoking: true,
      },
    });

    if (!user)
      return res.status(404).json({ ok: false, error: "User not found" });

    const photos = await prisma.datingUserPhoto.findMany({
      where: { user_id: userId },
      orderBy: { sort_order: "asc" },
    });

    const cuisines = await prisma.datingUserCuisine.findMany({
      where: { user_id: userId },
      select: { cuisine: true },
    });

    const interests = await prisma.datingUserInterest.findMany({
      where: { user_id: userId },
      select: { tag: true },
    });

    const firstDateTypes = await prisma.datingUserFirstDateType.findMany({
      where: { user_id: userId },
      select: { first_date_type: true },
    });

    const languages = await prisma.datingUserLanguage.findMany({
      where: { user_id: userId },
      select: { lang: true },
    });

    return res.json({
      ok: true,
      profile: {
        ...user,
        photos: photos.map((p) => ({
          id: p.id,
          objectKey: p.object_key,
          sortOrder: p.sort_order,
        })),
        cuisines: cuisines.map((c) => c.cuisine),
        interests: interests.map((i) => i.tag),
        firstDateTypes: firstDateTypes.map((f) => f.first_date_type),
        languages: languages.map((l) => l.lang),
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch profile" });
  }
});

router.get("/:userId", datingSessionMiddleware, async (req: any, res: any) => {
  const currentUserId = req.datingUserId as string | null;
  if (!currentUserId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  const targetUserId = req.params.userId;

  try {
    const match = await prisma.datingMatch.findFirst({
      where: {
        OR: [
          { user1_id: currentUserId, user2_id: targetUserId },
          { user1_id: targetUserId, user2_id: currentUserId },
        ],
        status: "MATCHED",
      },
    });

    if (!match)
      return res.status(403).json({ ok: false, error: "Not matched with this user" });

    const user = await prisma.datingUser.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        dob: true,
        profession: true,
        dreams: true,
        five_year_goal: true,
        what_i_want_in_partner: true,
        why_partner_would_like_me: true,
        physical_activity: true,
        date_budget: true,
        instagram_handle: true,
        diet: true,
        drinking: true,
        smoking: true,
      },
    });

    if (!user)
      return res.status(404).json({ ok: false, error: "User not found" });

    const photos = await prisma.datingUserPhoto.findMany({
      where: { user_id: targetUserId },
      orderBy: { sort_order: "asc" },
    });

    const cuisines = await prisma.datingUserCuisine.findMany({
      where: { user_id: targetUserId },
      select: { cuisine: true },
    });

    const interests = await prisma.datingUserInterest.findMany({
      where: { user_id: targetUserId },
      select: { tag: true },
    });

    const firstDateTypes = await prisma.datingUserFirstDateType.findMany({
      where: { user_id: targetUserId },
      select: { first_date_type: true },
    });

    const languages = await prisma.datingUserLanguage.findMany({
      where: { user_id: targetUserId },
      select: { lang: true },
    });

    return res.json({
      ok: true,
      profile: {
        ...user,
        photos: photos.map((p) => ({
          objectKey: p.object_key,
          sortOrder: p.sort_order,
        })),
        cuisines: cuisines.map((c) => c.cuisine),
        interests: interests.map((i) => i.tag),
        firstDateTypes: firstDateTypes.map((f) => f.first_date_type),
        languages: languages.map((l) => l.lang),
      },
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch profile" });
  }
});

router.put("/me", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const {
      name,
      profession,
      dreams,
      fiveYearGoal,
      whatIWantInPartner,
      whyPartnerWouldLikeMe,
      physicalActivity,
      dateBudget,
      instagramHandle,
      diet,
      drinking,
      smoking,
      cuisines,
      interests,
      firstDateTypes,
      languages,
    } = req.body;

    await prisma.datingUser.update({
      where: { id: userId },
      data: {
        name,
        profession,
        dreams,
        five_year_goal: fiveYearGoal,
        what_i_want_in_partner: whatIWantInPartner,
        why_partner_would_like_me: whyPartnerWouldLikeMe,
        physical_activity: physicalActivity,
        date_budget: dateBudget,
        instagram_handle: instagramHandle,
        diet,
        drinking,
        smoking,
      },
    });

    if (cuisines !== undefined) {
      await prisma.datingUserCuisine.deleteMany({ where: { user_id: userId } });
      if (cuisines.length > 0) {
        await prisma.datingUserCuisine.createMany({
          data: cuisines.map((c: string) => ({ user_id: userId, cuisine: c })),
        });
      }
    }

    if (interests !== undefined) {
      await prisma.datingUserInterest.deleteMany({ where: { user_id: userId } });
      if (interests.length > 0) {
        await prisma.datingUserInterest.createMany({
          data: interests.map((t: string) => ({ user_id: userId, tag: t })),
        });
      }
    }

    if (firstDateTypes !== undefined) {
      await prisma.datingUserFirstDateType.deleteMany({ where: { user_id: userId } });
      if (firstDateTypes.length > 0) {
        await prisma.datingUserFirstDateType.createMany({
          data: firstDateTypes.map((t: string) => ({ user_id: userId, first_date_type: t })),
        });
      }
    }

    if (languages !== undefined) {
      await prisma.datingUserLanguage.deleteMany({ where: { user_id: userId } });
      if (languages.length > 0) {
        await prisma.datingUserLanguage.createMany({
          data: languages.map((l: string) => ({ user_id: userId, lang: l })),
        });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ ok: false, error: "Failed to update profile" });
  }
});

export default router;
