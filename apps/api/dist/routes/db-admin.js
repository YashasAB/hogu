"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization header" });
    }
    const token = authHeader.slice(7);
    if (!ADMIN_PASSWORD || token !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Invalid admin password" });
    }
    next();
}
const TABLE_MAP = {
    // Dating option tables (admin-managed)
    cuisine_options: "CuisineOption",
    first_date_type_options: "FirstDateTypeOption",
    diet_options: "DietOption",
    drinking_options: "DrinkingOption",
    smoking_options: "SmokingOption",
    physical_activity_options: "PhysicalActivityOption",
    date_budget_options: "DateBudgetOption",
    // Dating user tables
    dating_users: "DatingUser",
    dating_user_photos: "DatingUserPhoto",
    dating_user_interests: "DatingUserInterest",
    dating_user_languages: "DatingUserLanguage",
    dating_user_cuisines: "DatingUserCuisine",
    dating_user_first_date_types: "DatingUserFirstDateType",
    dating_matches: "DatingMatch",
    admin_messages: "AdminMessage",
    // Restaurant tables
    restaurants: "Restaurant",
    restaurant_auth: "RestaurantAuth",
    restaurant_cuisine_tags: "RestaurantCuisineTag",
    cuisine_tags: "CuisineTag",
    time_slots: "TimeSlot",
    reservations: "Reservation",
    users: "User",
    user_auth: "UserAuth",
    user_details: "UserDetail",
};
router.get("/tables", requireAdminAuth, async (_req, res) => {
    try {
        const tables = Object.keys(TABLE_MAP);
        const counts = {};
        for (const table of tables) {
            const modelName = TABLE_MAP[table];
            try {
                const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
                if (model) {
                    counts[table] = await model.count();
                }
                else {
                    counts[table] = 0;
                }
            }
            catch {
                counts[table] = 0;
            }
        }
        res.json({ tables, counts });
    }
    catch (error) {
        console.error("Error fetching tables:", error);
        res.status(500).json({ error: "Failed to fetch tables" });
    }
});
router.get("/tables/:table", requireAdminAuth, async (req, res) => {
    try {
        const { table } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const skip = (page - 1) * limit;
        const modelName = TABLE_MAP[table];
        if (!modelName) {
            return res.status(404).json({ error: "Table not found" });
        }
        const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) {
            return res.status(404).json({ error: "Model not found" });
        }
        const [records, total] = await Promise.all([
            model.findMany({ take: limit, skip, orderBy: { id: "desc" } }),
            model.count(),
        ]);
        const columns = records.length > 0 ? Object.keys(records[0]) : [];
        res.json({
            table,
            columns,
            records,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching table data:", error);
        res.status(500).json({ error: "Failed to fetch table data" });
    }
});
router.get("/tables/:table/:id", requireAdminAuth, async (req, res) => {
    try {
        const { table, id } = req.params;
        const modelName = TABLE_MAP[table];
        if (!modelName) {
            return res.status(404).json({ error: "Table not found" });
        }
        const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) {
            return res.status(404).json({ error: "Model not found" });
        }
        const record = await model.findUnique({ where: { id } });
        if (!record) {
            return res.status(404).json({ error: "Record not found" });
        }
        res.json(record);
    }
    catch (error) {
        console.error("Error fetching record:", error);
        res.status(500).json({ error: "Failed to fetch record" });
    }
});
router.put("/tables/:table/:id", requireAdminAuth, async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = req.body;
        const modelName = TABLE_MAP[table];
        if (!modelName) {
            return res.status(404).json({ error: "Table not found" });
        }
        const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) {
            return res.status(404).json({ error: "Model not found" });
        }
        delete data.id;
        delete data.createdAt;
        const updated = await model.update({
            where: { id },
            data,
        });
        res.json({ success: true, record: updated });
    }
    catch (error) {
        console.error("Error updating record:", error);
        res.status(500).json({ error: "Failed to update record" });
    }
});
router.post("/tables/:table", requireAdminAuth, async (req, res) => {
    try {
        const { table } = req.params;
        const data = req.body;
        const modelName = TABLE_MAP[table];
        if (!modelName) {
            return res.status(404).json({ error: "Table not found" });
        }
        const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) {
            return res.status(404).json({ error: "Model not found" });
        }
        const created = await model.create({ data });
        res.json({ success: true, record: created });
    }
    catch (error) {
        console.error("Error creating record:", error);
        res.status(500).json({ error: "Failed to create record" });
    }
});
router.delete("/tables/:table/:id", requireAdminAuth, async (req, res) => {
    try {
        const { table, id } = req.params;
        const confirmDelete = req.headers["x-confirm-delete"];
        if (confirmDelete !== "true") {
            return res.status(400).json({
                error: "Deletion requires confirmation",
                message: "Set X-Confirm-Delete: true header to confirm deletion"
            });
        }
        const modelName = TABLE_MAP[table];
        if (!modelName) {
            return res.status(404).json({ error: "Table not found" });
        }
        const model = prisma[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
        if (!model) {
            return res.status(404).json({ error: "Model not found" });
        }
        await model.delete({ where: { id } });
        res.json({ success: true, deleted: id });
    }
    catch (error) {
        console.error("Error deleting record:", error);
        res.status(500).json({ error: "Failed to delete record" });
    }
});
exports.default = router;
