"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetToKnowLimitError = void 0;
exports.runGetToKnow = runGetToKnow;
exports.runGetToKnowStart = runGetToKnowStart;
exports.getGetToKnowStatus = getGetToKnowStatus;
const prismaClient_1 = __importDefault(require("../../../prismaClient"));
const buildInput_1 = require("./buildInput");
const generator_1 = require("./generator");
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
    const ops = [
        prismaClient_1.default.getToKnowMessage.create({
            data: { userId, role: "user", content: userMessage },
        }),
    ];
    if (reply) {
        ops.push(prismaClient_1.default.getToKnowMessage.create({
            data: { userId, role: "agent", content: reply },
        }));
    }
    if (Object.keys(profilePatch).length > 0) {
        ops.push(prismaClient_1.default.datingUser.update({
            where: { id: userId },
            data: profilePatch,
        }));
    }
    try {
        await prismaClient_1.default.$transaction(ops);
    }
    catch (err) {
        console.error("[GetToKnow] transaction failed:", err, "patch:", JSON.stringify(profilePatch));
        throw err;
    }
    const dailyRemaining = Math.max(0, DAILY_LIMIT - (input.todayUserCount + 1));
    return { reply, dailyRemaining };
}
async function runGetToKnowStart(userId) {
    const existingCount = await prismaClient_1.default.getToKnowMessage.count({ where: { userId } });
    if (existingCount > 0)
        return { reply: null };
    const input = await (0, buildInput_1.buildGetToKnowInput)(userId);
    const { reply } = await (0, generator_1.runGetToKnowGenerator)(null, input);
    if (reply) {
        await prismaClient_1.default.getToKnowMessage.create({
            data: { userId, role: "agent", content: reply },
        });
    }
    return { reply };
}
async function getGetToKnowStatus(userId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const count = await prismaClient_1.default.getToKnowMessage.count({
        where: { userId, role: "user", createdAt: { gte: todayStart } },
    });
    return {
        dailyUsed: count,
        dailyLimit: DAILY_LIMIT,
        dailyRemaining: Math.max(0, DAILY_LIMIT - count),
    };
}
