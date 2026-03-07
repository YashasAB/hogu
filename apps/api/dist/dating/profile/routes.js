"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const session_1 = require("../session");
const storage_1 = require("../uploads/storage");
const intro_agent_1 = require("../agents/intro-agent");
const router = (0, express_1.Router)();
const LIFESTYLE_CANONICAL = {
    diet: { vegetarian: "VEG", veg: "VEG", eggetarian: "EGG", egg: "EGG", non_vegetarian: "NON_VEG", nonvegetarian: "NON_VEG", "non-vegetarian": "NON_VEG", vegan: "VEGAN", jain: "JAIN" },
    drinking: { never: "NEVER", socially: "SOCIALLY", occasionally: "SOCIALLY", regularly: "OFTEN", often: "OFTEN" },
    smoking: { no: "NO", never: "NO", socially: "SOCIALLY", occasionally: "SOCIALLY", yes: "YES", regularly: "YES" },
    physicalActivity: { rarely: "RARELY", sedentary: "RARELY", light: "RARELY", sometimes: "SOMETIMES", moderate: "SOMETIMES", regular: "REGULAR", active: "REGULAR", very_active: "REGULAR", athlete: "ATHLETE" },
};
function normalizeLifestyle(field, val) {
    if (!val)
        return val;
    const map = LIFESTYLE_CANONICAL[field];
    if (!map)
        return val;
    return map[val.toLowerCase()] || val;
}
router.get("/matches", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const currentUser = await prismaClient_1.default.datingUser.findUnique({
            where: { id: userId },
            select: { gender: true },
        });
        const isMale = (currentUser?.gender || "Male") === "Male";
        const matches = await prismaClient_1.default.datingMatch.findMany({
            where: {
                OR: [{ user1_id: userId }, { user2_id: userId }],
                status: { not: "UNMATCHED" },
            },
        });
        let visibleMatches = matches;
        if (isMale) {
            const otherUserIds = matches.map((m) => m.user1_id === userId ? m.user2_id : m.user1_id);
            const otherUsers = await prismaClient_1.default.datingUser.findMany({
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
        const matchedUserIds = visibleMatches.map((m) => m.user1_id === userId ? m.user2_id : m.user1_id);
        const matchedUsers = await prismaClient_1.default.datingUser.findMany({
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
        const photos = await prismaClient_1.default.datingUserPhoto.findMany({
            where: { userId: { in: matchedUserIds } },
            orderBy: { sortOrder: "asc" },
        });
        const photosByUser = new Map();
        photos.forEach((p) => {
            if (!photosByUser.has(p.userId))
                photosByUser.set(p.userId, []);
            photosByUser.get(p.userId).push(p);
        });
        const result = matchedUsers.map((u) => {
            const match = visibleMatches.find((m) => m.user1_id === u.id || m.user2_id === u.id);
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
            };
        });
        return res.json({ ok: true, matches: result });
    }
    catch (err) {
        console.error("Error fetching matches:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch matches" });
    }
});
router.post("/matches/:matchId/interested", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { matchId } = req.params;
        const match = await prismaClient_1.default.datingMatch.findUnique({
            where: { id: matchId },
        });
        if (!match)
            return res.status(404).json({ ok: false, error: "Match not found" });
        if (match.user1_id !== userId && match.user2_id !== userId)
            return res.status(403).json({ ok: false, error: "Not part of this match" });
        const isUser1 = match.user1_id === userId;
        const updateData = {};
        if (isUser1) {
            updateData.user1Interested = true;
        }
        else {
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
        }
        else if (match.status === "MATCHED") {
            updateData.status = "INTERESTED";
        }
        const updated = await prismaClient_1.default.datingMatch.update({
            where: { id: matchId },
            data: updateData,
        });
        if (promotedToScheduling) {
            const schedulingMessage = "Great news! Both of you have shown interest. Please head to your Matches tab and fill in your availability (dates, times, and preferred neighborhoods) so we can help schedule your date!";
            await prismaClient_1.default.matchMessage.createMany({
                data: [
                    { matchId, userId: match.user1_id, fromAdmin: true, content: schedulingMessage },
                    { matchId, userId: match.user2_id, fromAdmin: true, content: schedulingMessage },
                ],
            });
        }
        const currentUser = await prismaClient_1.default.datingUser.findUnique({
            where: { id: userId },
            select: { gender: true },
        });
        if (currentUser?.gender === "Female") {
            (0, intro_agent_1.deliverPendingIntroToMale)(matchId);
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
    }
    catch (err) {
        console.error("Error expressing interest:", err);
        return res.status(500).json({ ok: false, error: "Failed to express interest" });
    }
});
router.get("/me", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const user = await prismaClient_1.default.datingUser.findUnique({
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
            },
        });
        if (!user)
            return res.status(404).json({ ok: false, error: "User not found" });
        const photos = await prismaClient_1.default.datingUserPhoto.findMany({
            where: { userId },
            orderBy: { sortOrder: "asc" },
        });
        const cuisines = await prismaClient_1.default.datingUserCuisine.findMany({
            where: { userId },
            include: { cuisineOption: { select: { value: true, label: true } } },
        });
        const interests = await prismaClient_1.default.datingUserInterest.findMany({
            where: { userId },
            select: { tag: true },
        });
        const firstDateTypes = await prismaClient_1.default.datingUserFirstDateType.findMany({
            where: { userId },
            include: { firstDateTypeOption: { select: { value: true, label: true } } },
        });
        const languages = await prismaClient_1.default.datingUserLanguage.findMany({
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
    }
    catch (err) {
        console.error("Error fetching profile:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch profile" });
    }
});
router.get("/messages", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const messages = await prismaClient_1.default.adminMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
        });
        await prismaClient_1.default.adminMessage.updateMany({
            where: { userId, fromAdmin: true, read: false },
            data: { read: true },
        });
        return res.json({ ok: true, messages });
    }
    catch (err) {
        console.error("Error fetching messages:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch messages" });
    }
});
router.post("/messages", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { content } = req.body;
        if (!content || typeof content !== "string") {
            return res.status(400).json({ ok: false, error: "Content required" });
        }
        const message = await prismaClient_1.default.adminMessage.create({
            data: {
                userId,
                content,
                fromAdmin: false,
                read: false,
            },
        });
        return res.status(201).json({ ok: true, message });
    }
    catch (err) {
        console.error("Error sending message:", err);
        return res.status(500).json({ ok: false, error: "Failed to send message" });
    }
});
router.get("/messages/unread-count", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const count = await prismaClient_1.default.adminMessage.count({
            where: { userId, fromAdmin: true, read: false },
        });
        return res.json({ ok: true, count });
    }
    catch (err) {
        console.error("Error fetching unread count:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch unread count" });
    }
});
router.get("/:userId", session_1.datingSessionMiddleware, async (req, res) => {
    const currentUserId = req.datingUserId;
    if (!currentUserId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    const targetUserId = req.params.userId;
    try {
        const match = await prismaClient_1.default.datingMatch.findFirst({
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
        const user = await prismaClient_1.default.datingUser.findUnique({
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
            },
        });
        if (!user)
            return res.status(404).json({ ok: false, error: "User not found" });
        const photos = await prismaClient_1.default.datingUserPhoto.findMany({
            where: { userId: targetUserId },
            orderBy: { sortOrder: "asc" },
        });
        const cuisines = await prismaClient_1.default.datingUserCuisine.findMany({
            where: { userId: targetUserId },
            include: { cuisineOption: { select: { value: true, label: true } } },
        });
        const interests = await prismaClient_1.default.datingUserInterest.findMany({
            where: { userId: targetUserId },
            select: { tag: true },
        });
        const firstDateTypes = await prismaClient_1.default.datingUserFirstDateType.findMany({
            where: { userId: targetUserId },
            include: { firstDateTypeOption: { select: { value: true, label: true } } },
        });
        const languages = await prismaClient_1.default.datingUserLanguage.findMany({
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
        const { name, profession, dreams, fiveYearGoal, whatIWantInPartner, whyPartnerWouldLikeMe, myDayLooksLike, idealFirstDate, nonNegotiables, physicalActivity, dateBudget, instagramHandle, diet, drinking, smoking, relationshipType, gender, agePreferenceMin, agePreferenceMax, cuisines, interests, firstDateTypes, languages, dateCity, dateNeighborhoods, city, } = req.body;
        await prismaClient_1.default.datingUser.update({
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
                physicalActivity: normalizeLifestyle("physicalActivity", physicalActivity),
                dateBudget,
                instagramHandle,
                diet: normalizeLifestyle("diet", diet),
                drinking: normalizeLifestyle("drinking", drinking),
                smoking: normalizeLifestyle("smoking", smoking),
                gender,
                relationshipType,
                agePreferenceMin: agePreferenceMin === undefined ? undefined : (agePreferenceMin !== null && agePreferenceMin !== "" ? parseInt(String(agePreferenceMin), 10) : null),
                agePreferenceMax: agePreferenceMax === undefined ? undefined : (agePreferenceMax !== null && agePreferenceMax !== "" ? parseInt(String(agePreferenceMax), 10) : null),
                dateCity,
                dateNeighborhoods,
                city,
            },
        });
        if (cuisines !== undefined) {
            await prismaClient_1.default.datingUserCuisine.deleteMany({ where: { userId } });
            if (cuisines.length > 0) {
                const cuisineOptions = await prismaClient_1.default.cuisineOption.findMany({
                    where: { value: { in: cuisines } },
                    select: { id: true },
                });
                await prismaClient_1.default.datingUserCuisine.createMany({
                    data: cuisineOptions.map((opt) => ({ userId, cuisineOptionId: opt.id })),
                });
            }
        }
        if (interests !== undefined) {
            await prismaClient_1.default.datingUserInterest.deleteMany({ where: { userId } });
            if (interests.length > 0) {
                await prismaClient_1.default.datingUserInterest.createMany({
                    data: interests.map((t) => ({ userId, tag: t })),
                });
            }
        }
        if (firstDateTypes !== undefined) {
            await prismaClient_1.default.datingUserFirstDateType.deleteMany({ where: { userId } });
            if (firstDateTypes.length > 0) {
                const firstDateTypeOptions = await prismaClient_1.default.firstDateTypeOption.findMany({
                    where: { value: { in: firstDateTypes } },
                    select: { id: true },
                });
                await prismaClient_1.default.datingUserFirstDateType.createMany({
                    data: firstDateTypeOptions.map((opt) => ({ userId, firstDateTypeOptionId: opt.id })),
                });
            }
        }
        if (languages !== undefined) {
            await prismaClient_1.default.datingUserLanguage.deleteMany({ where: { userId } });
            if (languages.length > 0) {
                await prismaClient_1.default.datingUserLanguage.createMany({
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
router.delete("/photos/:photoId", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { photoId } = req.params;
        const photo = await prismaClient_1.default.datingUserPhoto.findUnique({ where: { id: photoId } });
        if (!photo || photo.userId !== userId)
            return res.status(404).json({ ok: false, error: "Photo not found" });
        const photoCount = await prismaClient_1.default.datingUserPhoto.count({ where: { userId } });
        if (photoCount <= 1)
            return res.status(400).json({ ok: false, error: "You must keep at least 1 photo" });
        await prismaClient_1.default.datingUserPhoto.delete({ where: { id: photoId } });
        try {
            await (0, storage_1.deleteObject)(photo.objectKey);
        }
        catch (storageErr) {
            console.error("Failed to delete from storage (record already removed):", storageErr);
        }
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("Error deleting photo:", err);
        return res.status(500).json({ ok: false, error: "Failed to delete photo" });
    }
});
router.post("/photos", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { objectKey, sortOrder } = req.body;
        if (!objectKey)
            return res.status(400).json({ ok: false, error: "objectKey required" });
        const photoCount = await prismaClient_1.default.datingUserPhoto.count({ where: { userId } });
        if (photoCount >= 6)
            return res.status(400).json({ ok: false, error: "Maximum 6 photos allowed" });
        const photo = await prismaClient_1.default.datingUserPhoto.create({
            data: {
                userId,
                objectKey: String(objectKey),
                sortOrder: sortOrder ?? photoCount,
            },
        });
        return res.json({ ok: true, photo: { id: photo.id, objectKey: photo.objectKey, sortOrder: photo.sortOrder } });
    }
    catch (err) {
        console.error("Error adding photo:", err);
        return res.status(500).json({ ok: false, error: "Failed to add photo" });
    }
});
router.get("/matches/:matchId/availability", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { matchId } = req.params;
        const match = await prismaClient_1.default.datingMatch.findUnique({ where: { id: matchId } });
        if (!match)
            return res.status(404).json({ ok: false, error: "Match not found" });
        if (match.user1_id !== userId && match.user2_id !== userId)
            return res.status(403).json({ ok: false, error: "Not part of this match" });
        const entries = await prismaClient_1.default.matchAvailability.findMany({
            where: { matchId, userId },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ ok: true, availability: entries });
    }
    catch (err) {
        console.error("Error fetching availability:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch availability" });
    }
});
router.post("/matches/:matchId/availability", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { matchId } = req.params;
        const { datesFree, timesFree, neighborhoods } = req.body;
        if (!datesFree || !timesFree || !neighborhoods) {
            return res.status(400).json({ ok: false, error: "All fields are required: datesFree, timesFree, neighborhoods" });
        }
        const match = await prismaClient_1.default.datingMatch.findUnique({ where: { id: matchId } });
        if (!match)
            return res.status(404).json({ ok: false, error: "Match not found" });
        if (match.user1_id !== userId && match.user2_id !== userId)
            return res.status(403).json({ ok: false, error: "Not part of this match" });
        if (match.status !== "SCHEDULING" && match.status !== "CONFIRMED") {
            return res.status(400).json({ ok: false, error: "Match is not in scheduling stage" });
        }
        const entry = await prismaClient_1.default.matchAvailability.create({
            data: { matchId, userId, datesFree, timesFree, neighborhoods },
        });
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const otherUserAvailability = await prismaClient_1.default.matchAvailability.findFirst({
            where: { matchId, userId: otherUserId },
        });
        if (!otherUserAvailability) {
            const currentUser = await prismaClient_1.default.datingUser.findUnique({ where: { id: userId }, select: { name: true } });
            const nudgeMessage = `Yay! ${currentUser?.name || "Your match"} is down to go on a date and has shared their availability. Please head to your Matches tab and add yours now!`;
            await prismaClient_1.default.adminMessage.create({
                data: { userId: otherUserId, fromAdmin: true, content: nudgeMessage },
            });
        }
        return res.status(201).json({ ok: true, availability: entry });
    }
    catch (err) {
        console.error("Error creating availability:", err);
        return res.status(500).json({ ok: false, error: "Failed to save availability" });
    }
});
router.put("/availability/:entryId", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { entryId } = req.params;
        const { datesFree, timesFree, neighborhoods } = req.body;
        const entry = await prismaClient_1.default.matchAvailability.findUnique({ where: { id: entryId } });
        if (!entry)
            return res.status(404).json({ ok: false, error: "Availability entry not found" });
        if (entry.userId !== userId)
            return res.status(403).json({ ok: false, error: "Not your availability entry" });
        const updated = await prismaClient_1.default.matchAvailability.update({
            where: { id: entryId },
            data: {
                ...(datesFree !== undefined && { datesFree }),
                ...(timesFree !== undefined && { timesFree }),
                ...(neighborhoods !== undefined && { neighborhoods }),
            },
        });
        return res.json({ ok: true, availability: updated });
    }
    catch (err) {
        console.error("Error updating availability:", err);
        return res.status(500).json({ ok: false, error: "Failed to update availability" });
    }
});
router.delete("/availability/:entryId", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    if (!userId)
        return res.status(401).json({ ok: false, error: "Not authenticated" });
    try {
        const { entryId } = req.params;
        const entry = await prismaClient_1.default.matchAvailability.findUnique({ where: { id: entryId } });
        if (!entry)
            return res.status(404).json({ ok: false, error: "Availability entry not found" });
        if (entry.userId !== userId)
            return res.status(403).json({ ok: false, error: "Not your availability entry" });
        await prismaClient_1.default.matchAvailability.delete({ where: { id: entryId } });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("Error deleting availability:", err);
        return res.status(500).json({ ok: false, error: "Failed to delete availability" });
    }
});
router.get("/match-messages/:matchId", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    const { matchId } = req.params;
    try {
        const match = await prismaClient_1.default.datingMatch.findUnique({ where: { id: matchId } });
        if (!match)
            return res.status(404).json({ ok: false, error: "Match not found" });
        if (match.user1_id !== userId && match.user2_id !== userId)
            return res.status(403).json({ ok: false, error: "Not a participant in this match" });
        const messages = await prismaClient_1.default.matchMessage.findMany({
            where: { matchId, userId },
            orderBy: { createdAt: "asc" },
        });
        await prismaClient_1.default.matchMessage.updateMany({
            where: { matchId, userId, fromAdmin: true, read: false },
            data: { read: true },
        });
        return res.json({ ok: true, messages });
    }
    catch (err) {
        console.error("Error fetching match messages:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch match messages" });
    }
});
router.post("/match-messages/:matchId", session_1.datingSessionMiddleware, async (req, res) => {
    const userId = req.datingUserId;
    const { matchId } = req.params;
    const { content } = req.body;
    try {
        if (!content || !content.trim())
            return res.status(400).json({ ok: false, error: "Content is required" });
        const match = await prismaClient_1.default.datingMatch.findUnique({ where: { id: matchId } });
        if (!match)
            return res.status(404).json({ ok: false, error: "Match not found" });
        if (match.user1_id !== userId && match.user2_id !== userId)
            return res.status(403).json({ ok: false, error: "Not a participant in this match" });
        const message = await prismaClient_1.default.matchMessage.create({
            data: { matchId, userId, fromAdmin: false, content: content.trim() },
        });
        return res.status(201).json({ ok: true, message });
    }
    catch (err) {
        console.error("Error sending match message:", err);
        return res.status(500).json({ ok: false, error: "Failed to send match message" });
    }
});
exports.default = router;
