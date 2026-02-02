"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const session_1 = require("../session");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
router.get("/matches", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const matches = await prisma.datingMatch.findMany({
            where: {
                OR: [{ user1_id: userId }, { user2_id: userId }],
                status: "MATCHED",
            },
        });
        const matchedUserIds = matches.map((m) => m.user1_id === userId ? m.user2_id : m.user1_id);
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
        const photosByUser = new Map();
        photos.forEach((p) => {
            if (!photosByUser.has(p.userId))
                photosByUser.set(p.userId, []);
            photosByUser.get(p.userId).push(p);
        });
        const result = matchedUsers.map((u) => ({
            ...u,
            photos: (photosByUser.get(u.id) || []).map((p) => ({
                objectKey: p.objectKey,
                sortOrder: p.sortOrder,
            })),
            matchedAt: matches.find((m) => m.user1_id === u.id || m.user2_id === u.id)?.created_at,
        }));
        return res.json({ ok: true, matches: result });
    }
    catch (err) {
        console.error("Error fetching matches:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch matches" });
    }
});
router.get("/me", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
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
            select: { cuisine: true },
        });
        const interests = await prisma.datingUserInterest.findMany({
            where: { userId },
            select: { tag: true },
        });
        const firstDateTypes = await prisma.datingUserFirstDateType.findMany({
            where: { userId },
            select: { firstDateType: true },
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
                cuisines: cuisines.map((c) => c.cuisine),
                interests: interests.map((i) => i.tag),
                firstDateTypes: firstDateTypes.map((f) => f.firstDateType),
                languages: languages.map((l) => l.lang),
            },
        });
    }
    catch (err) {
        console.error("Error fetching profile:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch profile" });
    }
});
router.get("/:userId", session_1.datingSessionMiddleware, async (req, res) => {
    const currentUserId = req.datingUserId;
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
            select: { cuisine: true },
        });
        const interests = await prisma.datingUserInterest.findMany({
            where: { userId: targetUserId },
            select: { tag: true },
        });
        const firstDateTypes = await prisma.datingUserFirstDateType.findMany({
            where: { userId: targetUserId },
            select: { firstDateType: true },
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
                cuisines: cuisines.map((c) => c.cuisine),
                interests: interests.map((i) => i.tag),
                firstDateTypes: firstDateTypes.map((f) => f.firstDateType),
                languages: languages.map((l) => l.lang),
            },
        });
    }
    catch (err) {
        console.error("Error fetching user profile:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch profile" });
    }
});
router.put("/me", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { name, profession, dreams, fiveYearGoal, whatIWantInPartner, whyPartnerWouldLikeMe, physicalActivity, dateBudget, instagramHandle, diet, drinking, smoking, cuisines, interests, firstDateTypes, languages, } = req.body;
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
            },
        });
        if (cuisines !== undefined) {
            await prisma.datingUserCuisine.deleteMany({ where: { userId } });
            if (cuisines.length > 0) {
                await prisma.datingUserCuisine.createMany({
                    data: cuisines.map((c) => ({ userId, cuisine: c })),
                });
            }
        }
        if (interests !== undefined) {
            await prisma.datingUserInterest.deleteMany({ where: { userId } });
            if (interests.length > 0) {
                await prisma.datingUserInterest.createMany({
                    data: interests.map((t) => ({ userId, tag: t })),
                });
            }
        }
        if (firstDateTypes !== undefined) {
            await prisma.datingUserFirstDateType.deleteMany({ where: { userId } });
            if (firstDateTypes.length > 0) {
                await prisma.datingUserFirstDateType.createMany({
                    data: firstDateTypes.map((t) => ({ userId, firstDateType: t })),
                });
            }
        }
        if (languages !== undefined) {
            await prisma.datingUserLanguage.deleteMany({ where: { userId } });
            if (languages.length > 0) {
                await prisma.datingUserLanguage.createMany({
                    data: languages.map((l) => ({ userId, lang: l })),
                });
            }
        }
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ ok: false, error: "Failed to update profile" });
    }
});
exports.default = router;
