"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const client_1 = require("@prisma/client");
const password_1 = require("../password");
const session_1 = require("../session");
const validators_1 = require("./validators");
const prisma = new client_1.PrismaClient();
exports.AuthController = {
    async signup(req, res, next) {
        try {
            const data = (0, validators_1.requireSignupBody)(req.body);
            const exists = await prisma.datingUser.findFirst({
                where: { phoneE164: data.phoneE164 },
                select: { id: true },
            });
            if (exists)
                return res
                    .status(409)
                    .json({ ok: false, error: "Phone already registered" });
            const passwordHash = await (0, password_1.hashPassword)(data.password);
            const user = await prisma.datingUser.create({
                data: {
                    phoneE164: data.phoneE164,
                    passwordHash,
                    name: data.name,
                    dob: new Date(data.dob),
                    profession: data.profession,
                    dreams: data.dreams,
                    fiveYearGoal: data.fiveYearGoal,
                    whatIWantInPartner: data.whatIWantInPartner,
                    whyPartnerWouldLikeMe: data.whyPartnerWouldLikeMe,
                    physicalActivity: data.physicalActivity,
                    dateBudget: data.dateBudget,
                    instagramHandle: data.instagramHandle,
                    diet: data.diet,
                    drinking: data.drinking,
                    smoking: data.smoking,
                },
                select: { id: true, name: true, phoneE164: true },
            });
            (0, session_1.setSessionCookie)(res, user.id);
            return res.status(201).json({ ok: true, user });
        }
        catch (err) {
            if (err.details)
                return res
                    .status(err.status || 400)
                    .json({
                    ok: false,
                    error: "VALIDATION",
                    details: err.details,
                });
            return next(err);
        }
    },
    async login(req, res, next) {
        try {
            const { phoneE164, password } = (0, validators_1.requireLoginBody)(req.body);
            const user = await prisma.datingUser.findFirst({
                where: { phoneE164 },
                select: { id: true, name: true, phoneE164: true, passwordHash: true },
            });
            if (!user)
                return res
                    .status(401)
                    .json({ ok: false, error: "Invalid credentials" });
            const valid = await (0, password_1.verifyPassword)(password, user.passwordHash);
            if (!valid)
                return res
                    .status(401)
                    .json({ ok: false, error: "Invalid credentials" });
            (0, session_1.setSessionCookie)(res, user.id);
            return res
                .status(200)
                .json({
                ok: true,
                user: { id: user.id, name: user.name, phoneE164: user.phoneE164 },
            });
        }
        catch (err) {
            return next(err);
        }
    },
    async me(req, res) {
        const userId = req.datingUserId;
        if (!userId)
            return res.status(401).json({ ok: false, error: "Not authenticated" });
        const user = await prisma.datingUser.findFirst({
            where: { id: userId },
            select: { id: true, name: true, phoneE164: true },
        });
        if (!user)
            return res.status(401).json({ ok: false, error: "Not authenticated" });
        return res.status(200).json({ ok: true, user });
    },
    async logout(_req, res) {
        (0, session_1.clearSessionCookie)(res);
        return res.status(200).json({ ok: true });
    },
};
