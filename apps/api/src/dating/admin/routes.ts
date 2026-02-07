import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error("WARNING: ADMIN_PASSWORD environment variable is not set. Admin portal will be inaccessible.");
}

function requireAdminAuth(req: any, res: any, next: any) {
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

router.get("/users", requireAdminAuth, async (req: any, res: any) => {
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
        createdAt: true,
      },
    });

    const userIds = users.map((u) => u.id);
    const photos = await prisma.datingUserPhoto.findMany({
      where: { userId: { in: userIds } },
      orderBy: { sortOrder: "asc" },
    });

    const photosByUser = new Map<string, typeof photos>();
    photos.forEach((p) => {
      if (!photosByUser.has(p.userId)) photosByUser.set(p.userId, []);
      photosByUser.get(p.userId)!.push(p);
    });

    const result = users.map((u) => ({
      ...u,
      photos: (photosByUser.get(u.id) || []).map((p) => ({
        objectKey: p.objectKey,
        sortOrder: p.sortOrder,
      })),
    }));

    return res.json({ ok: true, users: result });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch users" });
  }
});

router.get("/users/export/csv", requireAdminAuth, async (req: any, res: any) => {
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

    const photosByUser = new Map<string, number>();
    photos.forEach((p) => {
      photosByUser.set(p.userId, (photosByUser.get(p.userId) || 0) + 1);
    });

    const groupBy = <T extends { userId: string }>(items: T[]) => {
      const map = new Map<string, T[]>();
      items.forEach((item) => {
        if (!map.has(item.userId)) map.set(item.userId, []);
        map.get(item.userId)!.push(item);
      });
      return map;
    };

    const cuisinesByUser = groupBy(cuisines);
    const interestsByUser = groupBy(interests);
    const firstDatesByUser = groupBy(firstDateTypes);
    const langsByUser = groupBy(languages);

    const columns = [
      "Name", "Phone", "Date of Birth", "Age", "Profession", "Height",
      "Instagram", "Diet", "Drinking", "Smoking", "Physical Activity",
      "Date Budget", "Cuisines", "First Date Ideas", "Interests", "Languages",
      "Dreams", "Five Year Goal", "What I Want in a Partner",
      "Why My Partner Would Like Me", "Photos Count", "Joined"
    ];

    function escCsv(val: unknown): string {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    function calcAge(dob: Date): number {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
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
        new Date(u.dob).toLocaleDateString("en-IN"),
        String(calcAge(new Date(u.dob))),
        u.profession || "",
        u.height || "",
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
        String(photosByUser.get(u.id) || 0),
        new Date(u.createdAt).toLocaleDateString("en-IN"),
      ].map(escCsv).join(",");
    });

    const csv = [columns.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="hogu-users-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("Error exporting users:", err);
    return res.status(500).json({ ok: false, error: "Failed to export users" });
  }
});

router.get("/users/:userId", requireAdminAuth, async (req: any, res: any) => {
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
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch user" });
  }
});

router.get("/matches", requireAdminAuth, async (req: any, res: any) => {
  try {
    const matches = await prisma.datingMatch.findMany({
      orderBy: { created_at: "desc" },
    });

    const userIds = new Set<string>();
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
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    return res.json({ ok: true, matches: result });
  } catch (err) {
    console.error("Error fetching matches:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch matches" });
  }
});

router.post("/matches", requireAdminAuth, async (req: any, res: any) => {
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
  } catch (err) {
    console.error("Error creating match:", err);
    return res.status(500).json({ ok: false, error: "Failed to create match" });
  }
});

router.put("/matches/:matchId", requireAdminAuth, async (req: any, res: any) => {
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
  } catch (err) {
    console.error("Error updating match:", err);
    return res.status(500).json({ ok: false, error: "Failed to update match" });
  }
});

router.delete("/matches/:matchId", requireAdminAuth, async (req: any, res: any) => {
  try {
    const { matchId } = req.params;

    await prisma.datingMatch.delete({
      where: { id: matchId },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting match:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete match" });
  }
});

router.delete("/users/:userId", requireAdminAuth, async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const user = await prisma.datingUser.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    await prisma.$transaction([
      prisma.adminMessage.deleteMany({ where: { userId } }),
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
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ ok: false, error: "Failed to delete user" });
  }
});

router.get("/messages", requireAdminAuth, async (req: any, res: any) => {
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
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch messages" });
  }
});

router.get("/messages/:userId", requireAdminAuth, async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    const messages = await prisma.adminMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ ok: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    return res.status(500).json({ ok: false, error: "Failed to fetch messages" });
  }
});

router.post("/messages", requireAdminAuth, async (req: any, res: any) => {
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
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({ ok: false, error: "Failed to send message" });
  }
});

export default router;
