"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGetToKnowInput = buildGetToKnowInput;
const prismaClient_1 = __importDefault(require("../../../prismaClient"));
function getAge(dob) {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate()))
        age--;
    return age;
}
async function buildGetToKnowInput(userId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [user, messages, dietOpts, drinkOpts, smokeOpts, actOpts, budgetOpts, cuisineOpts, dateTypeOpts, relTypeOpts,] = await Promise.all([
        prismaClient_1.default.datingUser.findUniqueOrThrow({
            where: { id: userId },
            include: {
                cuisines: { include: { cuisineOption: true } },
                firstDateTypes: { include: { firstDateTypeOption: true } },
                interests: true,
                languages: true,
                photos: { select: { id: true } },
            },
        }),
        prismaClient_1.default.getToKnowMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { role: true, content: true, createdAt: true },
        }),
        prismaClient_1.default.dietOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
        prismaClient_1.default.drinkingOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
        prismaClient_1.default.smokingOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
        prismaClient_1.default.physicalActivityOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
        prismaClient_1.default.dateBudgetOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
        prismaClient_1.default.cuisineOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
        prismaClient_1.default.firstDateTypeOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
        prismaClient_1.default.relationshipTypeOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true } }),
    ]);
    const todayUserCount = messages.filter((m) => m.role === "user" && new Date(m.createdAt) >= todayStart).length;
    // Reverse to restore chronological order (oldest→newest), latest message last
    const last5Messages = messages.reverse().map((m) => ({
        role: m.role === "agent" ? "assistant" : m.role,
        content: m.content,
    }));
    const cuisineLabels = user.cuisines.map((c) => c.cuisineOption.label).join(", ") || null;
    const firstDateLabels = user.firstDateTypes.map((f) => f.firstDateTypeOption.label).join(", ") || null;
    const interestLabels = user.interests.map((i) => i.tag).join(", ") || null;
    const languageLabels = user.languages.map((l) => l.lang).join(", ") || null;
    const userSchemaJson = {
        "Name": user.name,
        "Gender": user.gender,
        "Date of Birth": user.dob.toISOString().split("T")[0],
        "Age": getAge(user.dob),
        "Profession": user.profession ?? null,
        "Height": user.height ?? null,
        "Looking For": user.relationshipType ?? null,
        "Age Pref Min": user.agePreferenceMin ?? null,
        "Age Pref Max": user.agePreferenceMax ?? null,
        "Date City": user.dateCity ?? null,
        "Date Neighborhoods": user.dateNeighborhoods ?? null,
        "Diet": user.diet ?? null,
        "Drinking": user.drinking ?? null,
        "Smoking": user.smoking ?? null,
        "Physical Activity": user.physicalActivity ?? null,
        "Date Budget": user.dateBudget ?? null,
        "Cuisines": cuisineLabels,
        "First Date Ideas": firstDateLabels,
        "Interests": interestLabels,
        "Languages": languageLabels,
        "Dreams": user.dreams ?? null,
        "Five Year Goal": user.fiveYearGoal ?? null,
        "What I Want in a Partner": user.whatIWantInPartner ?? null,
        "Why My Partner Would Like Me": user.whyPartnerWouldLikeMe ?? null,
        "My Day Looks Like": user.myDayLooksLike ?? null,
        "Ideal First Date": user.idealFirstDate ?? null,
        "Non-Negotiables": user.nonNegotiables ?? null,
        "City": user.city,
        "Photos Count": user.photos.length,
        "Joined": user.createdAt.toISOString().split("T")[0],
        "_option_reference": {
            "Diet options": dietOpts.map((o) => o.label),
            "Drinking options": drinkOpts.map((o) => o.label),
            "Smoking options": smokeOpts.map((o) => o.label),
            "Physical Activity options": actOpts.map((o) => o.label),
            "Date Budget options": budgetOpts.map((o) => o.label),
            "Cuisine options": cuisineOpts.map((o) => o.label),
            "First Date Type options": dateTypeOpts.map((o) => o.label),
            "Looking For options": relTypeOpts.map((o) => o.label),
        },
    };
    return { userSchemaJson, last5Messages, todayUserCount, userId };
}
