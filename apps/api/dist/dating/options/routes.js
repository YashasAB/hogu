"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get("/", async (_req, res) => {
    try {
        const [cuisines, firstDateTypes, diets, drinking, smoking, physicalActivity, dateBudget,] = await Promise.all([
            prisma.cuisineOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prisma.firstDateTypeOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prisma.dietOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prisma.drinkingOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prisma.smokingOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prisma.physicalActivityOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prisma.dateBudgetOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
        ]);
        res.json({
            cuisines,
            firstDateTypes,
            diets,
            drinking,
            smoking,
            physicalActivity,
            dateBudget,
        });
    }
    catch (error) {
        console.error("Error fetching options:", error);
        res.status(500).json({ error: "Failed to fetch options" });
    }
});
exports.default = router;
