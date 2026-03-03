"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const router = (0, express_1.Router)();
router.get("/", async (_req, res) => {
    try {
        const [cuisines, firstDateTypes, diets, drinking, smoking, physicalActivity, dateBudget,] = await Promise.all([
            prismaClient_1.default.cuisineOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prismaClient_1.default.firstDateTypeOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prismaClient_1.default.dietOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prismaClient_1.default.drinkingOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prismaClient_1.default.smokingOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prismaClient_1.default.physicalActivityOption.findMany({
                where: { active: true },
                orderBy: { sortOrder: "asc" },
                select: { value: true, label: true },
            }),
            prismaClient_1.default.dateBudgetOption.findMany({
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
