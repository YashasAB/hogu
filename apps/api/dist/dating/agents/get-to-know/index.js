"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetToKnowLimitError = void 0;
exports.runGetToKnow = runGetToKnow;
exports.getGetToKnowStatus = getGetToKnowStatus;
const client_1 = require("@prisma/client");
const buildInput_1 = require("./buildInput");
const generator_1 = require("./generator");
const prisma = new client_1.PrismaClient();
const DAILY_LIMIT = 5;
class GetToKnowLimitError extends Error {
    constructor() {
        super("Daily message limit reached");
        this.name = "GetToKnowLimitError";
    }
}
exports.GetToKnowLimitError = GetToKnowLimitError;
async function runGetToKnow(userId, userMessage) {
    const input = await (0, buildInput_1.buildGetToKnowInput)(userId);
    if (input.todayUserCount >= DAILY_LIMIT) {
        throw new GetToKnowLimitError();
    }
    const { reply, profilePatch } = await (0, generator_1.runGetToKnowGenerator)(userMessage, input);
    const agentContent = reply ?? "";
    const ops = [
        prisma.getToKnowMessage.create({
            data: { userId, role: "user", content: userMessage },
        }),
        prisma.getToKnowMessage.create({
            data: { userId, role: "agent", content: agentContent },
        }),
    ];
    if (Object.keys(profilePatch).length > 0) {
        ops.push(prisma.datingUser.update({
            where: { id: userId },
            data: profilePatch,
        }));
    }
    await prisma.$transaction(ops);
    const dailyRemaining = Math.max(0, DAILY_LIMIT - (input.todayUserCount + 1));
    return { reply, dailyRemaining };
}
async function getGetToKnowStatus(userId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const count = await prisma.getToKnowMessage.count({
        where: { userId, role: "user", createdAt: { gte: todayStart } },
    });
    return {
        dailyUsed: count,
        dailyLimit: DAILY_LIMIT,
        dailyRemaining: Math.max(0, DAILY_LIMIT - count),
    };
}
