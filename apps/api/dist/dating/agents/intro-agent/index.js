"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIntroAgent = runIntroAgent;
exports.deliverPendingIntroToMale = deliverPendingIntroToMale;
exports.deletePendingIntro = deletePendingIntro;
const prismaClient_1 = __importDefault(require("../../../prismaClient"));
const buildInput_1 = require("./buildInput");
const generator_1 = require("./generator");
function formatMessageContent(title, body, cta) {
    return [body, cta].filter(Boolean).join("\n\n");
}
async function runIntroAgent(matchId) {
    try {
        const input = await (0, buildInput_1.buildIntroInput)(matchId);
        const output = await (0, generator_1.generateIntroMessages)(input);
        const userA = input.users[0];
        const userB = input.users[1];
        const femaleUser = [userA, userB].find((u) => u.profile.Gender === "Female");
        const maleUser = [userA, userB].find((u) => u.profile.Gender !== "Female");
        if (!femaleUser || !maleUser) {
            console.warn(`[IntroAgent] Match ${matchId}: could not identify female/male user pair. Delivering both messages immediately.`);
            for (const msg of output.messages) {
                const content = formatMessageContent(msg.title, msg.body, msg.cta);
                await prismaClient_1.default.matchMessage.create({
                    data: { matchId, userId: msg.to_user_id, fromAdmin: true, content },
                });
            }
            return;
        }
        const femaleMessage = output.messages.find((m) => m.to_user_id === femaleUser.user_id);
        const maleMessage = output.messages.find((m) => m.to_user_id === maleUser.user_id);
        if (femaleMessage) {
            const content = formatMessageContent(femaleMessage.title, femaleMessage.body, femaleMessage.cta);
            await prismaClient_1.default.matchMessage.create({
                data: { matchId, userId: femaleMessage.to_user_id, fromAdmin: true, content },
            });
            console.log(`[IntroAgent] Match ${matchId}: intro message delivered to female user ${femaleMessage.to_user_id}`);
        }
        if (maleMessage) {
            const content = formatMessageContent(maleMessage.title, maleMessage.body, maleMessage.cta);
            await prismaClient_1.default.pendingIntroMessage.upsert({
                where: { matchId },
                create: { matchId, toUserId: maleMessage.to_user_id, content },
                update: { toUserId: maleMessage.to_user_id, content },
            });
            console.log(`[IntroAgent] Match ${matchId}: intro message queued for male user ${maleMessage.to_user_id}`);
        }
    }
    catch (err) {
        console.error(`[IntroAgent] Match ${matchId}: agent failed —`, err);
    }
}
async function deliverPendingIntroToMale(matchId) {
    try {
        const pending = await prismaClient_1.default.pendingIntroMessage.findUnique({
            where: { matchId },
        });
        if (!pending) {
            console.log(`[IntroAgent] Match ${matchId}: no pending intro message found for male delivery.`);
            return;
        }
        await prismaClient_1.default.matchMessage.create({
            data: { matchId: pending.matchId, userId: pending.toUserId, fromAdmin: true, content: pending.content },
        });
        await prismaClient_1.default.pendingIntroMessage.delete({ where: { matchId } });
        console.log(`[IntroAgent] Match ${matchId}: pending intro delivered to male user ${pending.toUserId}`);
    }
    catch (err) {
        console.error(`[IntroAgent] Match ${matchId}: failed to deliver pending intro —`, err);
    }
}
async function deletePendingIntro(matchId) {
    try {
        await prismaClient_1.default.pendingIntroMessage.deleteMany({ where: { matchId } });
        console.log(`[IntroAgent] Match ${matchId}: pending intro message deleted (unmatch/cleanup).`);
    }
    catch (err) {
        console.error(`[IntroAgent] Match ${matchId}: failed to delete pending intro —`, err);
    }
}
