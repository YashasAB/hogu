"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
    console.error("WARNING: ADMIN_PASSWORD environment variable is not set. Admin portal will be inaccessible.");
}
function requireAdminAuth(req, res, next) {
    if (!ADMIN_PASSWORD) {
        return res.status(503).json({ ok: false, error: "Admin portal not configured" });
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const token = authHeader.slice(7);
    if (token !== ADMIN_PASSWORD) {
        return res.status(401).json({ ok: false, error: "Invalid admin password" });
    }
    next();
}
router.get("/users", requireAdminAuth, async (req, res) => {
    try {
        const users = await prisma.datingUser.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                phoneE164: true,
                dob: true,
                profession: true,
                height: true,
                gender: true,
                relationshipType: true,
                agePreferenceMin: true,
                agePreferenceMax: true,
                dateCity: true,
                dateNeighborhoods: true,
                city: true,
                createdAt: true,
            },
        });
        const userIds = users.map((u) => u.id);
        const photos = await prisma.datingUserPhoto.findMany({
            where: { userId: { in: userIds } },
            orderBy: { sortOrder: "asc" },
        });
        const photosByUser = new Map();
        photos.forEach((p) => {
            if (!photosByUser.has(p.userId))
                photosByUser.set(p.userId, []);
            photosByUser.get(p.userId).push(p);
        });
        const result = users.map((u) => ({
            ...u,
            photos: (photosByUser.get(u.id) || []).map((p) => ({
                objectKey: p.objectKey,
                sortOrder: p.sortOrder,
            })),
        }));
        return res.json({ ok: true, users: result });
    }
    catch (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch users" });
    }
});
router.get("/users/export/csv", requireAdminAuth, async (req, res) => {
    try {
        const users = await prisma.datingUser.findMany({
            orderBy: { createdAt: "desc" },
        });
        const userIds = users.map((u) => u.id);
        const [photos, cuisines, interests, firstDateTypes, languages] = await Promise.all([
            prisma.datingUserPhoto.findMany({
                where: { userId: { in: userIds } },
                orderBy: { sortOrder: "asc" },
            }),
            prisma.datingUserCuisine.findMany({
                where: { userId: { in: userIds } },
                include: { cuisineOption: { select: { label: true } } },
            }),
            prisma.datingUserInterest.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true, tag: true },
            }),
            prisma.datingUserFirstDateType.findMany({
                where: { userId: { in: userIds } },
                include: { firstDateTypeOption: { select: { label: true } } },
            }),
            prisma.datingUserLanguage.findMany({
                where: { userId: { in: userIds } },
                select: { userId: true, lang: true },
            }),
        ]);
        const photosByUser = new Map();
        photos.forEach((p) => {
            photosByUser.set(p.userId, (photosByUser.get(p.userId) || 0) + 1);
        });
        const groupBy = (items) => {
            const map = new Map();
            items.forEach((item) => {
                if (!map.has(item.userId))
                    map.set(item.userId, []);
                map.get(item.userId).push(item);
            });
            return map;
        };
        const cuisinesByUser = groupBy(cuisines);
        const interestsByUser = groupBy(interests);
        const firstDatesByUser = groupBy(firstDateTypes);
        const langsByUser = groupBy(languages);
        const columns = [
            "Name", "Phone", "Gender", "Date of Birth", "Age", "Profession", "Height",
            "Looking For", "Age Pref Min", "Age Pref Max", "Date City", "Date Neighborhoods", "Instagram", "Diet", "Drinking", "Smoking", "Physical Activity",
            "Date Budget", "Cuisines", "First Date Ideas", "Interests", "Languages",
            "Dreams", "Five Year Goal", "What I Want in a Partner",
            "Why My Partner Would Like Me", "My Day Looks Like", "Ideal First Date",
            "Non-Negotiables", "City", "Photos Count", "Joined"
        ];
        function escCsv(val) {
            if (val === null || val === undefined)
                return "";
            const str = String(val);
            if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }
        function calcAge(dob) {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate()))
                age--;
            return age;
        }
        const rows = users.map((u) => {
            const uCuisines = (cuisinesByUser.get(u.id) || []).map((c) => c.cuisineOption.label).join("; ");
            const uInterests = (interestsByUser.get(u.id) || []).map((i) => i.tag).join("; ");
            const uFirstDates = (firstDatesByUser.get(u.id) || []).map((f) => f.firstDateTypeOption.label).join("; ");
            const uLangs = (langsByUser.get(u.id) || []).map((l) => l.lang).join("; ");
            return [
                u.name,
                u.phoneE164,
                u.gender || "Male",
                new Date(u.dob).toLocaleDateString("en-IN"),
                String(calcAge(new Date(u.dob))),
                u.profession || "",
                u.height || "",
                u.relationshipType === "casual" ? "Casual" : "Serious",
                u.agePreferenceMin !== null ? String(u.agePreferenceMin) : "",
                u.agePreferenceMax !== null ? String(u.agePreferenceMax) : "",
                u.dateCity || "",
                u.dateNeighborhoods || "",
                u.instagramHandle || "",
                u.diet || "",
                u.drinking || "",
                u.smoking || "",
                u.physicalActivity || "",
                u.dateBudget || "",
                uCuisines,
                uFirstDates,
                uInterests,
                uLangs,
                u.dreams || "",
                u.fiveYearGoal || "",
                u.whatIWantInPartner || "",
                u.whyPartnerWouldLikeMe || "",
                u.myDayLooksLike || "",
                u.idealFirstDate || "",
                u.nonNegotiables || "",
                u.city || "BLR",
                String(photosByUser.get(u.id) || 0),
                new Date(u.createdAt).toLocaleDateString("en-IN"),
            ].map(escCsv).join(",");
        });
        const csv = [columns.join(","), ...rows].join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="hogu-users-${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);
    }
    catch (err) {
        console.error("Error exporting users:", err);
        return res.status(500).json({ ok: false, error: "Failed to export users" });
    }
});
router.get("/users/:userId", requireAdminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.datingUser.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ ok: false, error: "User not found" });
        }
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
            user: {
                ...user,
                passwordHash: undefined,
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
        console.error("Error fetching user:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch user" });
    }
});
router.get("/matches", requireAdminAuth, async (req, res) => {
    try {
        const matches = await prisma.datingMatch.findMany({
            orderBy: { created_at: "desc" },
        });
        const userIds = new Set();
        matches.forEach((m) => {
            userIds.add(m.user1_id);
            userIds.add(m.user2_id);
        });
        const users = await prisma.datingUser.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: { id: true, name: true, phoneE164: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const result = matches.map((m) => ({
            id: m.id,
            user1: userMap.get(m.user1_id),
            user2: userMap.get(m.user2_id),
            status: m.status,
            user1Interested: m.user1Interested,
            user2Interested: m.user2Interested,
            createdAt: m.created_at,
            updatedAt: m.updated_at,
        }));
        return res.json({ ok: true, matches: result });
    }
    catch (err) {
        console.error("Error fetching matches:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch matches" });
    }
});
router.post("/matches", requireAdminAuth, async (req, res) => {
    try {
        const { user1Id, user2Id, status = "MATCHED" } = req.body;
        if (!user1Id || !user2Id) {
            return res.status(400).json({ ok: false, error: "Both user IDs required" });
        }
        const [id1, id2] = [user1Id, user2Id].sort();
        const existing = await prisma.datingMatch.findFirst({
            where: {
                user1_id: id1,
                user2_id: id2,
            },
        });
        if (existing) {
            return res.status(409).json({ ok: false, error: "Match already exists", matchId: existing.id });
        }
        const match = await prisma.datingMatch.create({
            data: {
                user1_id: id1,
                user2_id: id2,
                status,
            },
        });
        return res.status(201).json({ ok: true, match });
    }
    catch (err) {
        console.error("Error creating match:", err);
        return res.status(500).json({ ok: false, error: "Failed to create match" });
    }
});
router.put("/matches/:matchId", requireAdminAuth, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { status } = req.body;
        const validStatuses = ["MATCHED", "INTERESTED", "SCHEDULING", "CONFIRMED", "COMPLETED", "UNMATCHED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ ok: false, error: "Invalid status" });
        }
        const match = await prisma.datingMatch.update({
            where: { id: matchId },
            data: { status },
        });
        return res.json({ ok: true, match });
    }
    catch (err) {
        console.error("Error updating match:", err);
        return res.status(500).json({ ok: false, error: "Failed to update match" });
    }
});
router.put("/matches/:matchId/interest", requireAdminAuth, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { user, interested } = req.body;
        if (!user || (user !== "user1" && user !== "user2")) {
            return res.status(400).json({ ok: false, error: "user must be 'user1' or 'user2'" });
        }
        if (typeof interested !== "boolean") {
            return res.status(400).json({ ok: false, error: "interested must be a boolean" });
        }
        const match = await prisma.datingMatch.findUnique({
            where: { id: matchId },
        });
        if (!match) {
            return res.status(404).json({ ok: false, error: "Match not found" });
        }
        const updateData = {};
        if (user === "user1") {
            updateData.user1Interested = interested;
        }
        else {
            updateData.user2Interested = interested;
        }
        const newUser1Interested = user === "user1" ? interested : match.user1Interested;
        const newUser2Interested = user === "user2" ? interested : match.user2Interested;
        let promotedToScheduling = false;
        if (newUser1Interested && newUser2Interested && (match.status === "MATCHED" || match.status === "INTERESTED")) {
            updateData.status = "SCHEDULING";
            promotedToScheduling = true;
        }
        else if (!newUser1Interested && !newUser2Interested && (match.status === "MATCHED" || match.status === "INTERESTED")) {
            updateData.status = "MATCHED";
        }
        else if ((newUser1Interested || newUser2Interested) && (match.status === "MATCHED" || match.status === "INTERESTED")) {
            updateData.status = "INTERESTED";
        }
        const updated = await prisma.datingMatch.update({
            where: { id: matchId },
            data: updateData,
        });
        if (promotedToScheduling) {
            const schedulingMessage = "Great news! Both of you have shown interest. Please head to your Matches tab and fill in your availability (dates, times, and preferred neighborhoods) so we can help schedule your date!";
            await prisma.adminMessage.createMany({
                data: [
                    { userId: match.user1_id, fromAdmin: true, content: schedulingMessage },
                    { userId: match.user2_id, fromAdmin: true, content: schedulingMessage },
                ],
            });
        }
        return res.json({ ok: true, match: updated });
    }
    catch (err) {
        console.error("Error updating match interest:", err);
        return res.status(500).json({ ok: false, error: "Failed to update match interest" });
    }
});
router.get("/matches/:matchId/availability", requireAdminAuth, async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await prisma.datingMatch.findUnique({ where: { id: matchId } });
        if (!match)
            return res.status(404).json({ ok: false, error: "Match not found" });
        const entries = await prisma.matchAvailability.findMany({
            where: { matchId },
            orderBy: { createdAt: "desc" },
        });
        const user1Entries = entries.filter((e) => e.userId === match.user1_id);
        const user2Entries = entries.filter((e) => e.userId === match.user2_id);
        return res.json({
            ok: true,
            user1Filled: user1Entries.length > 0,
            user2Filled: user2Entries.length > 0,
            user1Availability: user1Entries,
            user2Availability: user2Entries,
        });
    }
    catch (err) {
        console.error("Error fetching match availability:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch availability" });
    }
});
router.delete("/matches/:matchId", requireAdminAuth, async (req, res) => {
    try {
        const { matchId } = req.params;
        await prisma.datingMatch.delete({
            where: { id: matchId },
        });
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("Error deleting match:", err);
        return res.status(500).json({ ok: false, error: "Failed to delete match" });
    }
});
router.delete("/users/:userId", requireAdminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.datingUser.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ ok: false, error: "User not found" });
        }
        await prisma.$transaction([
            prisma.adminMessage.deleteMany({ where: { userId } }),
            prisma.matchAvailability.deleteMany({ where: { userId } }),
            prisma.datingMatch.deleteMany({
                where: { OR: [{ user1_id: userId }, { user2_id: userId }] },
            }),
            prisma.datingUserCuisine.deleteMany({ where: { userId } }),
            prisma.datingUserInterest.deleteMany({ where: { userId } }),
            prisma.datingUserFirstDateType.deleteMany({ where: { userId } }),
            prisma.datingUserLanguage.deleteMany({ where: { userId } }),
            prisma.datingUserPhoto.deleteMany({ where: { userId } }),
            prisma.datingUser.delete({ where: { id: userId } }),
        ]);
        return res.json({ ok: true });
    }
    catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({ ok: false, error: "Failed to delete user" });
    }
});
router.get("/messages", requireAdminAuth, async (req, res) => {
    try {
        const messages = await prisma.adminMessage.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        const userIds = [...new Set(messages.map((m) => m.userId))];
        const users = await prisma.datingUser.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, phoneE164: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const result = messages.map((m) => ({
            ...m,
            user: userMap.get(m.userId),
        }));
        return res.json({ ok: true, messages: result });
    }
    catch (err) {
        console.error("Error fetching messages:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch messages" });
    }
});
router.get("/messages/:userId", requireAdminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await prisma.adminMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
        });
        return res.json({ ok: true, messages });
    }
    catch (err) {
        console.error("Error fetching messages:", err);
        return res.status(500).json({ ok: false, error: "Failed to fetch messages" });
    }
});
router.post("/messages", requireAdminAuth, async (req, res) => {
    try {
        const { userId, content } = req.body;
        if (!userId || !content) {
            return res.status(400).json({ ok: false, error: "userId and content required" });
        }
        const message = await prisma.adminMessage.create({
            data: {
                userId,
                content,
                fromAdmin: true,
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
router.get("/matches/export/csv", requireAdminAuth, async (req, res) => {
    try {
        const matches = await prisma.datingMatch.findMany({
            orderBy: { created_at: "desc" },
            include: {
                availability: true,
            },
        });
        const userIds = new Set();
        matches.forEach((m) => {
            userIds.add(m.user1_id);
            userIds.add(m.user2_id);
        });
        const users = await prisma.datingUser.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: { id: true, name: true, phoneE164: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        function escCsv(val) {
            if (val === null || val === undefined)
                return "";
            const str = String(val);
            if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }
        const matchColumns = [
            "Match ID", "User 1 Name", "User 1 Phone", "User 2 Name", "User 2 Phone",
            "Status", "User 1 Interested", "User 2 Interested", "Created At", "Updated At"
        ];
        const matchRows = matches.map((m) => {
            const u1 = userMap.get(m.user1_id);
            const u2 = userMap.get(m.user2_id);
            return [
                m.id,
                u1?.name || "Unknown",
                u1?.phoneE164 || "",
                u2?.name || "Unknown",
                u2?.phoneE164 || "",
                m.status,
                m.user1Interested ? "Yes" : "No",
                m.user2Interested ? "Yes" : "No",
                new Date(m.created_at).toLocaleDateString("en-IN") + " " + new Date(m.created_at).toLocaleTimeString("en-IN"),
                new Date(m.updated_at).toLocaleDateString("en-IN") + " " + new Date(m.updated_at).toLocaleTimeString("en-IN"),
            ].map(escCsv).join(",");
        });
        const availColumns = [
            "Match ID", "User Name", "User Phone", "Dates Free", "Times Free", "Neighborhoods", "Submitted At"
        ];
        const allAvailability = matches.flatMap((m) => m.availability.map((a) => {
            const u = userMap.get(a.userId);
            return [
                m.id,
                u?.name || "Unknown",
                u?.phoneE164 || "",
                a.datesFree,
                a.timesFree,
                a.neighborhoods,
                new Date(a.createdAt).toLocaleDateString("en-IN") + " " + new Date(a.createdAt).toLocaleTimeString("en-IN"),
            ].map(escCsv).join(",");
        }));
        const csvParts = [
            "=== MATCHES ===",
            matchColumns.join(","),
            ...matchRows,
            "",
            "=== SCHEDULING AVAILABILITY ===",
            availColumns.join(","),
            ...allAvailability,
        ];
        const csv = csvParts.join("\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="hogu-matches-${new Date().toISOString().slice(0, 10)}.csv"`);
        return res.send(csv);
    }
    catch (err) {
        console.error("Error exporting matches:", err);
        return res.status(500).json({ ok: false, error: "Failed to export matches" });
    }
});
exports.default = router;
