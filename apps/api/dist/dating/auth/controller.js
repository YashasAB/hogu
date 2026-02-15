"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const client_1 = require("@prisma/client");
const password_1 = require("../password");
const session_1 = require("../session");
const validators_1 = require("./validators");
const prisma = new client_1.PrismaClient();
const PASSWORD_RESET_TOKEN = process.env.PASSWORD_RESET_TOKEN;
const LIFESTYLE_CANONICAL = {
    diet: { vegetarian: "VEG", veg: "VEG", eggetarian: "EGG", egg: "EGG", non_vegetarian: "NON_VEG", nonvegetarian: "NON_VEG", "non-vegetarian": "NON_VEG", vegan: "VEGAN", jain: "JAIN" },
    drinking: { never: "NEVER", socially: "SOCIALLY", occasionally: "SOCIALLY", regularly: "OFTEN", often: "OFTEN" },
    smoking: { no: "NO", never: "NO", socially: "SOCIALLY", occasionally: "SOCIALLY", yes: "YES", regularly: "YES" },
    physicalActivity: { rarely: "RARELY", sedentary: "RARELY", light: "RARELY", sometimes: "SOMETIMES", moderate: "SOMETIMES", regular: "REGULAR", active: "REGULAR", very_active: "REGULAR", athlete: "ATHLETE" },
};
function normalizeLifestyle(field, val) {
    if (!val)
        return val;
    const map = LIFESTYLE_CANONICAL[field];
    if (!map)
        return val;
    return map[val.toLowerCase()] || val;
}
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
            const hash = await (0, password_1.hashPassword)(data.password);
            const user = await prisma.datingUser.create({
                data: {
                    phoneE164: data.phoneE164,
                    passwordHash: hash,
                    name: data.name,
                    dob: new Date(data.dob),
                    profession: data.profession,
                    dreams: data.dreams,
                    fiveYearGoal: data.fiveYearGoal,
                    whatIWantInPartner: data.whatIWantInPartner,
                    whyPartnerWouldLikeMe: data.whyPartnerWouldLikeMe,
                    myDayLooksLike: data.myDayLooksLike,
                    idealFirstDate: data.idealFirstDate,
                    nonNegotiables: data.nonNegotiables,
                    physicalActivity: normalizeLifestyle("physicalActivity", data.physicalActivity),
                    dateBudget: data.dateBudget,
                    instagramHandle: data.instagramHandle,
                    diet: normalizeLifestyle("diet", data.diet),
                    drinking: normalizeLifestyle("drinking", data.drinking),
                    smoking: normalizeLifestyle("smoking", data.smoking),
                    height: data.height,
                    gender: data.gender,
                    relationshipType: data.relationshipType,
                    agePreferenceMin: data.agePreferenceMin,
                    agePreferenceMax: data.agePreferenceMax,
                    dateCity: data.dateCity,
                    dateNeighborhoods: data.dateNeighborhoods,
                    city: data.city,
                },
                select: { id: true, name: true, phoneE164: true },
            });
            // Save photos
            await Promise.all(data.photos.map((p) => prisma.datingUserPhoto.create({
                data: {
                    userId: user.id,
                    objectKey: p.objectKey,
                    sortOrder: p.sortOrder ?? 0,
                },
                select: { id: true },
            })));
            // Save cuisines (lookup by value, create junction records)
            if (data.cuisines && data.cuisines.length > 0) {
                const cuisineOptions = await prisma.cuisineOption.findMany({
                    where: { value: { in: data.cuisines } },
                    select: { id: true },
                });
                await Promise.all(cuisineOptions.map((opt) => prisma.datingUserCuisine.create({
                    data: { userId: user.id, cuisineOptionId: opt.id },
                })));
            }
            // Save first date types (lookup by value, create junction records)
            if (data.firstDateTypes && data.firstDateTypes.length > 0) {
                const firstDateOptions = await prisma.firstDateTypeOption.findMany({
                    where: { value: { in: data.firstDateTypes } },
                    select: { id: true },
                });
                await Promise.all(firstDateOptions.map((opt) => prisma.datingUserFirstDateType.create({
                    data: { userId: user.id, firstDateTypeOptionId: opt.id },
                })));
            }
            // Save interests (free-form tags)
            if (data.interests && data.interests.length > 0) {
                await Promise.all(data.interests.map((tag) => prisma.datingUserInterest.create({
                    data: { userId: user.id, tag },
                })));
            }
            // Save languages (free-form)
            if (data.languages && data.languages.length > 0) {
                await Promise.all(data.languages.map((lang) => prisma.datingUserLanguage.create({
                    data: { userId: user.id, lang },
                })));
            }
            // Check if profile essays are incomplete and auto-message user
            const hasIncompleteProfile = !data.dreams || data.dreams.trim().length < 20 ||
                !data.fiveYearGoal || data.fiveYearGoal.trim().length < 20 ||
                !data.whatIWantInPartner || data.whatIWantInPartner.trim().length < 20 ||
                !data.whyPartnerWouldLikeMe || data.whyPartnerWouldLikeMe.trim().length < 20 ||
                !data.myDayLooksLike || data.myDayLooksLike.trim().length < 20 ||
                !data.idealFirstDate || data.idealFirstDate.trim().length < 20 ||
                !data.nonNegotiables || data.nonNegotiables.trim().length < 20;
            if (hasIncompleteProfile) {
                await prisma.adminMessage.create({
                    data: {
                        userId: user.id,
                        fromAdmin: true,
                        content: `Hey ${user.name}! Welcome to Hogu! 🎉

We noticed your profile is missing some important details that help us find your perfect match.

Please take a few minutes to complete these sections in your profile:
• Your dreams and aspirations
• Your 5-year goals
• What you're looking for in a partner
• Why your partner would love dating you
• What your typical day looks like
• Your ideal fun first date
• Your non-negotiables in a partner

The more you share, the better we can match you with someone truly compatible. Head to your profile and tap "Edit Profile" to add these details!

Your matchmaker`,
                        read: false,
                    },
                });
            }
            (0, session_1.setSessionCookie)(req, res, user.id);
            return res.status(201).json({ ok: true, user: { id: user.id, name: user.name, phoneE164: user.phoneE164 } });
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
            (0, session_1.setSessionCookie)(req, res, user.id);
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
        return res.status(200).json({ ok: true, user: { id: user.id, name: user.name, phoneE164: user.phoneE164 } });
    },
    async logout(req, res) {
        (0, session_1.clearSessionCookie)(req, res);
        return res.status(200).json({ ok: true });
    },
    async resetPassword(req, res, next) {
        try {
            const { phone, resetToken, newPassword } = req.body;
            if (!phone || !resetToken || !newPassword) {
                return res.status(400).json({ ok: false, error: "Phone number, reset token, and new password are required" });
            }
            if (!PASSWORD_RESET_TOKEN) {
                return res.status(503).json({ ok: false, error: "Password reset is not configured" });
            }
            if (resetToken !== PASSWORD_RESET_TOKEN) {
                return res.status(403).json({ ok: false, error: "Invalid reset token. Please contact your matchmaker for the correct token." });
            }
            if (newPassword.length < 8) {
                return res.status(400).json({ ok: false, error: "New password must be at least 8 characters" });
            }
            const phoneE164 = phone.startsWith("+") ? phone : `+${phone}`;
            const user = await prisma.datingUser.findFirst({
                where: { phoneE164 },
                select: { id: true, name: true },
            });
            if (!user) {
                return res.status(404).json({ ok: false, error: "No account found with this phone number" });
            }
            const hash = await (0, password_1.hashPassword)(newPassword);
            await prisma.datingUser.update({
                where: { id: user.id },
                data: { passwordHash: hash },
            });
            return res.status(200).json({ ok: true, message: "Password has been reset successfully. You can now log in with your new password." });
        }
        catch (err) {
            return next(err);
        }
    },
};
