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
        status: { not: "UNMATCHED" },
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
      where: { userId: { in: matchedUserIds } },
      orderBy: { sortOrder: "asc" },
    });

    const photosByUser = new Map<string, typeof photos>();
    photos.forEach((p) => {
      if (!photosByUser.has(p.userId)) photosByUser.set(p.userId, []);
      photosByUser.get(p.userId)!.push(p);
    });

    const result = matchedUsers.map((u) => {
      const match = matches.find(
        (m) => m.user1_id === u.id || m.user2_id === u.id
      );
      return {
        ...u,
        photos: (photosByUser.get(u.id) || []).map((p) => ({
          objectKey: p.objectKey,
          sortOrder: p.sortOrder,
        })),
        matchedAt: match?.created_at,
        status: match?.status || "MATCHED",
        matchId: match?.id,
      };
    });

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
        phoneE164: true,
        dob: true,
        profession: true,
        dreams: true,
        fiveYearGoal: true,
        whatIWantInPartner: true,
        whyPartnerWouldLikeMe: true,
        physicalActivity: true,
        dateBudget: true,
        instagramHandle: true,
        diet: true,
        drinking: true,
        smoking: true,
        height: true,
        relationshipType: true,
        agePreferenceMin: true,
        agePreferenceMax: true,
      },
    });

    if (!user)
      return res.status(404).json({ ok: false, error: "User not found" });

    const photos = await prisma.datingUserPhoto.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    });

    const cuisines = await prisma.datingUserCuisine.findMany({
      where: { userId },
      include: { cuisineOption: { select: { value: true, label: true } } },
    });

    const interests = await prisma.datingUserInterest.findMany({
      where: { userId },
      select: { tag: true },
    });

    const firstDateTypes = await prisma.datingUserFirstDateType.findMany({
      where: { userId },
      include: { firstDateTypeOption: { select: { value: true, label: true } } },
    });

    const languages = await prisma.datingUserLanguage.findMany({
      where: { userId },
      select: { lang: true },
    });

    return res.json({
      ok: true,
      profile: {
        ...user,
        photos: photos.map((p) => ({
          id: p.id,
          objectKey: p.objectKey,
          sortOrder: p.sortOrder,
        })),
        cuisines: cuisines.map((c) => c.cuisineOption.value),
        interests: interests.map((i) => i.tag),
        firstDateTypes: firstDateTypes.map((f) => f.firstDateTypeOption.value),
        languages: languages.map((l) => l.lang),
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch profile" });
  }
});

router.get("/messages", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const messages = await prisma.adminMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    await prisma.adminMessage.updateMany({
      where: { userId, fromAdmin: true, read: false },
      data: { read: true },
    });

    return res.json({ ok: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch messages" });
  }
});

router.post("/messages", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ ok: false, error: "Content required" });
    }

    const message = await prisma.adminMessage.create({
      data: {
        userId,
        content,
        fromAdmin: false,
        read: false,
      },
    });

    return res.status(201).json({ ok: true, message });
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({ ok: false, error: "Failed to send message" });
  }
});

router.get("/messages/unread-count", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const count = await prisma.adminMessage.count({
      where: { userId, fromAdmin: true, read: false },
    });

    return res.json({ ok: true, count });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch unread count" });
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
        fiveYearGoal: true,
        whatIWantInPartner: true,
        whyPartnerWouldLikeMe: true,
        physicalActivity: true,
        dateBudget: true,
        instagramHandle: true,
        diet: true,
        drinking: true,
        smoking: true,
        height: true,
        relationshipType: true,
      },
    });

    if (!user)
      return res.status(404).json({ ok: false, error: "User not found" });

    const photos = await prisma.datingUserPhoto.findMany({
      where: { userId: targetUserId },
      orderBy: { sortOrder: "asc" },
    });

    const cuisines = await prisma.datingUserCuisine.findMany({
      where: { userId: targetUserId },
      include: { cuisineOption: { select: { value: true, label: true } } },
    });

    const interests = await prisma.datingUserInterest.findMany({
      where: { userId: targetUserId },
      select: { tag: true },
    });

    const firstDateTypes = await prisma.datingUserFirstDateType.findMany({
      where: { userId: targetUserId },
      include: { firstDateTypeOption: { select: { value: true, label: true } } },
    });

    const languages = await prisma.datingUserLanguage.findMany({
      where: { userId: targetUserId },
      select: { lang: true },
    });

    return res.json({
      ok: true,
      profile: {
        ...user,
        photos: photos.map((p) => ({
          objectKey: p.objectKey,
          sortOrder: p.sortOrder,
        })),
        cuisines: cuisines.map((c) => c.cuisineOption.value),
        interests: interests.map((i) => i.tag),
        firstDateTypes: firstDateTypes.map((f) => f.firstDateTypeOption.value),
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
      relationshipType,
      agePreferenceMin,
      agePreferenceMax,
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
        fiveYearGoal,
        whatIWantInPartner,
        whyPartnerWouldLikeMe,
        physicalActivity,
        dateBudget,
        instagramHandle,
        diet,
        drinking,
        smoking,
        relationshipType,
        agePreferenceMin: agePreferenceMin === undefined ? undefined : (agePreferenceMin !== null && agePreferenceMin !== "" ? parseInt(String(agePreferenceMin), 10) : null),
        agePreferenceMax: agePreferenceMax === undefined ? undefined : (agePreferenceMax !== null && agePreferenceMax !== "" ? parseInt(String(agePreferenceMax), 10) : null),
      },
    });

    if (cuisines !== undefined) {
      await prisma.datingUserCuisine.deleteMany({ where: { userId } });
      if (cuisines.length > 0) {
        const cuisineOptions = await prisma.cuisineOption.findMany({
          where: { value: { in: cuisines } },
          select: { id: true },
        });
        await prisma.datingUserCuisine.createMany({
          data: cuisineOptions.map((opt) => ({ userId, cuisineOptionId: opt.id })),
        });
      }
    }

    if (interests !== undefined) {
      await prisma.datingUserInterest.deleteMany({ where: { userId } });
      if (interests.length > 0) {
        await prisma.datingUserInterest.createMany({
          data: interests.map((t: string) => ({ userId, tag: t })),
        });
      }
    }

    if (firstDateTypes !== undefined) {
      await prisma.datingUserFirstDateType.deleteMany({ where: { userId } });
      if (firstDateTypes.length > 0) {
        const firstDateTypeOptions = await prisma.firstDateTypeOption.findMany({
          where: { value: { in: firstDateTypes } },
          select: { id: true },
        });
        await prisma.datingUserFirstDateType.createMany({
          data: firstDateTypeOptions.map((opt) => ({ userId, firstDateTypeOptionId: opt.id })),
        });
      }
    }

    if (languages !== undefined) {
      await prisma.datingUserLanguage.deleteMany({ where: { userId } });
      if (languages.length > 0) {
        await prisma.datingUserLanguage.createMany({
          data: languages.map((l: string) => ({ userId, lang: l })),
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
