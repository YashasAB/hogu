import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const [
      cuisines,
      firstDateTypes,
      diets,
      drinking,
      smoking,
      physicalActivity,
      dateBudget,
    ] = await Promise.all([
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
  } catch (error) {
    console.error("Error fetching options:", error);
    res.status(500).json({ error: "Failed to fetch options" });
  }
});

export default router;
