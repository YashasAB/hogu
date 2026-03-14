import { Router } from "express";
import prisma from "../../prismaClient";
import { datingSessionMiddleware } from "../session";
import { deleteObject, presignPhotoUpload } from "../uploads/storage";
import { deliverPendingIntroToMale } from "../agents/intro-agent";

const router = Router();

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

router.get("/matches", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const currentUser = await prisma.datingUser.findUnique({
      where: { id: userId },
      select: { gender: true },
    });
    const isMale = (currentUser?.gender || "Male") === "Male";

    const matches = await prisma.datingMatch.findMany({
      where: {
        OR: [{ user1_id: userId }, { user2_id: userId }],
        status: { not: "UNMATCHED" },
      },
    });

    let visibleMatches = matches;
    if (isMale) {
      const otherUserIds = matches.map((m) =>
        m.user1_id === userId ? m.user2_id : m.user1_id
      );
      const otherUsers = await prisma.datingUser.findMany({
        where: { id: { in: otherUserIds } },
        select: { id: true, gender: true },
      });
      const otherGenderMap = new Map(otherUsers.map((u) => [u.id, u.gender]));

      visibleMatches = matches.filter((m) => {
        const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
        const otherGender = otherGenderMap.get(otherId) || "Male";
        if (otherGender === "Female") {
          const femaleIsUser1 = m.user1_id === otherId;
          const femaleInterested = femaleIsUser1 ? m.user1Interested : m.user2Interested;
          return femaleInterested;
        }
        return true;
      });
    }

    const matchedUserIds = visibleMatches.map((m) =>
      m.user1_id === userId ? m.user2_id : m.user1_id
    );

    const matchedUsers = await prisma.datingUser.findMany({
      where: { id: { in: matchedUserIds } },
      select: {
        id: true,
        name: true,
        profession: true,
        dob: true,
        dreams: true,
        fiveYearGoal: true,
        whatIWantInPartner: true,
        whyPartnerWouldLikeMe: true,
        myDayLooksLike: true,
        idealFirstDate: true,
        nonNegotiables: true,
        physicalActivity: true,
        dateBudget: true,
        diet: true,
        drinking: true,
        smoking: true,
        height: true,
        gender: true,
        relationshipType: true,
        agePreferenceMin: true,
        agePreferenceMax: true,
        dateCity: true,
        dateNeighborhoods: true,
        city: true,
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

    const unreadGroups = await prisma.matchMessage.groupBy({
      by: ["matchId"],
      where: {
        userId,
        fromAdmin: true,
        read: false,
        matchId: { in: visibleMatches.map((m) => m.id) },
      },
      _count: { id: true },
    });
    const unreadByMatch = new Map(unreadGroups.map((g) => [g.matchId, g._count.id]));

    const result = matchedUsers.map((u) => {
      const match = visibleMatches.find(
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
        user1Interested: match?.user1Interested ?? false,
        user2Interested: match?.user2Interested ?? false,
        user1_id: match?.user1_id,
        user2_id: match?.user2_id,
        myUserId: userId,
        unreadCount: unreadByMatch.get(match?.id ?? "") ?? 0,
      };
    });

    return res.json({ ok: true, matches: result });
  } catch (err) {
    console.error("Error fetching matches:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch matches" });
  }
});

router.post("/matches/:matchId/interested", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { matchId } = req.params;

    const match = await prisma.datingMatch.findUnique({
      where: { id: matchId },
    });

    if (!match)
      return res.status(404).json({ ok: false, error: "Match not found" });

    if (match.user1_id !== userId && match.user2_id !== userId)
      return res.status(403).json({ ok: false, error: "Not part of this match" });

    const isUser1 = match.user1_id === userId;
    const updateData: any = {};

    if (isUser1) {
      updateData.user1Interested = true;
    } else {
      updateData.user2Interested = true;
    }

    const newUser1Interested = isUser1 ? true : match.user1Interested;
    const newUser2Interested = isUser1 ? match.user2Interested : true;

    if (match.status !== "MATCHED" && match.status !== "INTERESTED") {
      return res.status(400).json({ ok: false, error: "Cannot express interest at this stage" });
    }

    let promotedToScheduling = false;
    if (newUser1Interested && newUser2Interested) {
      updateData.status = "SCHEDULING";
      promotedToScheduling = true;
    } else if (match.status === "MATCHED") {
      updateData.status = "INTERESTED";
    }

    const updated = await prisma.datingMatch.update({
      where: { id: matchId },
      data: updateData,
    });

    if (promotedToScheduling) {
      const schedulingMessage = "Great news! Both of you have shown interest. Please head to your Matches tab and fill in your availability (dates, times, and preferred neighborhoods) so we can help schedule your date!";
      await prisma.matchMessage.createMany({
        data: [
          { matchId, userId: match.user1_id, fromAdmin: true, content: schedulingMessage },
          { matchId, userId: match.user2_id, fromAdmin: true, content: schedulingMessage },
        ],
      });
    }

    const currentUser = await prisma.datingUser.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    if (currentUser?.gender === "Female") {
      deliverPendingIntroToMale(matchId);
    }

    return res.json({
      ok: true,
      match: {
        id: updated.id,
        user1Interested: updated.user1Interested,
        user2Interested: updated.user2Interested,
        status: updated.status,
      },
    });
  } catch (err) {
    console.error("Error expressing interest:", err);
    return res.status(500).json({ ok: false, error: "Failed to express interest" });
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
        myDayLooksLike: true,
        idealFirstDate: true,
        nonNegotiables: true,
        physicalActivity: true,
        dateBudget: true,
        instagramHandle: true,
        diet: true,
        drinking: true,
        smoking: true,
        height: true,
        gender: true,
        relationshipType: true,
        agePreferenceMin: true,
        agePreferenceMax: true,
        dateCity: true,
        dateNeighborhoods: true,
        city: true,
        interestsText: true,
        languagesText: true,
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
        interestsText: user.interestsText ?? "",
        languagesText: user.languagesText ?? "",
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
        status: { in: ["MATCHED", "INTERESTED", "SCHEDULING", "CONFIRMED", "COMPLETED"] },
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
        myDayLooksLike: true,
        idealFirstDate: true,
        nonNegotiables: true,
        physicalActivity: true,
        dateBudget: true,
        instagramHandle: true,
        diet: true,
        drinking: true,
        smoking: true,
        height: true,
        gender: true,
        relationshipType: true,
        dateCity: true,
        dateNeighborhoods: true,
        city: true,
        interestsText: true,
        languagesText: true,
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
        interestsText: user.interestsText ?? "",
        languagesText: user.languagesText ?? "",
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
      myDayLooksLike,
      idealFirstDate,
      nonNegotiables,
      physicalActivity,
      dateBudget,
      instagramHandle,
      diet,
      drinking,
      smoking,
      relationshipType,
      gender,
      agePreferenceMin,
      agePreferenceMax,
      cuisines,
      interests,
      interestsText,
      languagesText,
      firstDateTypes,
      languages,
      dateCity,
      dateNeighborhoods,
      city,
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
        myDayLooksLike,
        idealFirstDate,
        nonNegotiables,
        physicalActivity: normalizeLifestyle("physicalActivity", physicalActivity) as string | undefined,
        dateBudget,
        instagramHandle,
        diet: normalizeLifestyle("diet", diet) as string | undefined,
        drinking: normalizeLifestyle("drinking", drinking) as string | undefined,
        smoking: normalizeLifestyle("smoking", smoking) as string | undefined,
        gender,
        relationshipType,
        agePreferenceMin: agePreferenceMin === undefined ? undefined : (agePreferenceMin !== null && agePreferenceMin !== "" ? parseInt(String(agePreferenceMin), 10) : null),
        agePreferenceMax: agePreferenceMax === undefined ? undefined : (agePreferenceMax !== null && agePreferenceMax !== "" ? parseInt(String(agePreferenceMax), 10) : null),
        dateCity,
        dateNeighborhoods,
        city,
        ...(interestsText !== undefined ? { interestsText } : {}),
        ...(languagesText !== undefined ? { languagesText } : {}),
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

router.delete("/photos/:photoId", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { photoId } = req.params;
    const photo = await prisma.datingUserPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== userId)
      return res.status(404).json({ ok: false, error: "Photo not found" });

    const photoCount = await prisma.datingUserPhoto.count({ where: { userId } });
    if (photoCount <= 1)
      return res.status(400).json({ ok: false, error: "You must keep at least 1 photo" });

    await prisma.datingUserPhoto.delete({ where: { id: photoId } });

    try {
      await deleteObject(photo.objectKey);
    } catch (storageErr) {
      console.error("Failed to delete from storage (record already removed):", storageErr);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting photo:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete photo" });
  }
});

router.post("/photos", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { objectKey, sortOrder } = req.body;
    if (!objectKey)
      return res.status(400).json({ ok: false, error: "objectKey required" });

    const photoCount = await prisma.datingUserPhoto.count({ where: { userId } });
    if (photoCount >= 6)
      return res.status(400).json({ ok: false, error: "Maximum 6 photos allowed" });

    const photo = await prisma.datingUserPhoto.create({
      data: {
        userId,
        objectKey: String(objectKey),
        sortOrder: sortOrder ?? photoCount,
      },
    });

    return res.json({ ok: true, photo: { id: photo.id, objectKey: photo.objectKey, sortOrder: photo.sortOrder } });
  } catch (err) {
    console.error("Error adding photo:", err);
    return res.status(500).json({ ok: false, error: "Failed to add photo" });
  }
});

router.get("/matches/:matchId/availability", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { matchId } = req.params;

    const match = await prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match)
      return res.status(404).json({ ok: false, error: "Match not found" });

    if (match.user1_id !== userId && match.user2_id !== userId)
      return res.status(403).json({ ok: false, error: "Not part of this match" });

    const entries = await prisma.matchAvailability.findMany({
      where: { matchId, userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ ok: true, availability: entries });
  } catch (err) {
    console.error("Error fetching availability:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch availability" });
  }
});

router.post("/matches/:matchId/availability", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { matchId } = req.params;
    const { datesFree, timesFree, neighborhoods } = req.body;

    if (!datesFree || !timesFree || !neighborhoods) {
      return res.status(400).json({ ok: false, error: "All fields are required: datesFree, timesFree, neighborhoods" });
    }

    const match = await prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match)
      return res.status(404).json({ ok: false, error: "Match not found" });

    if (match.user1_id !== userId && match.user2_id !== userId)
      return res.status(403).json({ ok: false, error: "Not part of this match" });

    if (match.status !== "SCHEDULING" && match.status !== "CONFIRMED") {
      return res.status(400).json({ ok: false, error: "Match is not in scheduling stage" });
    }

    const entry = await prisma.matchAvailability.create({
      data: { matchId, userId, datesFree, timesFree, neighborhoods },
    });

    const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    const otherUserAvailability = await prisma.matchAvailability.findFirst({
      where: { matchId, userId: otherUserId },
    });

    if (!otherUserAvailability) {
      const currentUser = await prisma.datingUser.findUnique({ where: { id: userId }, select: { name: true } });
      const nudgeMessage = `Yay! ${currentUser?.name || "Your match"} is down to go on a date and has shared their availability. Please head to your Matches tab and add yours now!`;
      await prisma.adminMessage.create({
        data: { userId: otherUserId, fromAdmin: true, content: nudgeMessage },
      });
    }

    return res.status(201).json({ ok: true, availability: entry });
  } catch (err) {
    console.error("Error creating availability:", err);
    return res.status(500).json({ ok: false, error: "Failed to save availability" });
  }
});

router.put("/availability/:entryId", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { entryId } = req.params;
    const { datesFree, timesFree, neighborhoods } = req.body;

    const entry = await prisma.matchAvailability.findUnique({ where: { id: entryId } });
    if (!entry)
      return res.status(404).json({ ok: false, error: "Availability entry not found" });

    if (entry.userId !== userId)
      return res.status(403).json({ ok: false, error: "Not your availability entry" });

    const updated = await prisma.matchAvailability.update({
      where: { id: entryId },
      data: {
        ...(datesFree !== undefined && { datesFree }),
        ...(timesFree !== undefined && { timesFree }),
        ...(neighborhoods !== undefined && { neighborhoods }),
      },
    });

    return res.json({ ok: true, availability: updated });
  } catch (err) {
    console.error("Error updating availability:", err);
    return res.status(500).json({ ok: false, error: "Failed to update availability" });
  }
});

router.delete("/availability/:entryId", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { entryId } = req.params;

    const entry = await prisma.matchAvailability.findUnique({ where: { id: entryId } });
    if (!entry)
      return res.status(404).json({ ok: false, error: "Availability entry not found" });

    if (entry.userId !== userId)
      return res.status(403).json({ ok: false, error: "Not your availability entry" });

    await prisma.matchAvailability.delete({ where: { id: entryId } });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting availability:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete availability" });
  }
});

router.get("/match-messages/:matchId", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string;
  const { matchId } = req.params;
  try {
    const match = await prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ ok: false, error: "Match not found" });
    if (match.user1_id !== userId && match.user2_id !== userId)
      return res.status(403).json({ ok: false, error: "Not a participant in this match" });

    const messages = await prisma.matchMessage.findMany({
      where: { matchId, userId },
      orderBy: { createdAt: "asc" },
    });

    await prisma.matchMessage.updateMany({
      where: { matchId, userId, fromAdmin: true, read: false },
      data: { read: true },
    });

    return res.json({ ok: true, messages });
  } catch (err) {
    console.error("Error fetching match messages:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch match messages" });
  }
});

router.post("/match-messages/:matchId", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string;
  const { matchId } = req.params;
  const { content } = req.body;
  try {
    if (!content || !content.trim())
      return res.status(400).json({ ok: false, error: "Content is required" });

    const match = await prisma.datingMatch.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ ok: false, error: "Match not found" });
    if (match.user1_id !== userId && match.user2_id !== userId)
      return res.status(403).json({ ok: false, error: "Not a participant in this match" });

    const message = await prisma.matchMessage.create({
      data: { matchId, userId, fromAdmin: false, content: content.trim() },
    });

    return res.status(201).json({ ok: true, message });
  } catch (err) {
    console.error("Error sending match message:", err);
    return res.status(500).json({ ok: false, error: "Failed to send match message" });
  }
});

router.post("/onesignal-id", datingSessionMiddleware, async (req: any, res: any) => {
  const userId = req.datingUserId as string | null;
  if (!userId)
    return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const { oneSignalId } = req.body;
    if (!oneSignalId || typeof oneSignalId !== "string")
      return res.status(400).json({ ok: false, error: "oneSignalId is required" });

    await prisma.datingUser.update({
      where: { id: userId },
      data: { oneSignalId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error saving OneSignal ID:", err);
    return res.status(500).json({ ok: false, error: "Failed to save OneSignal ID" });
  }
});

export default router;
