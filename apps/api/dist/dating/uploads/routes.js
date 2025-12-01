"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storage_1 = require("./storage");
const router = (0, express_1.Router)();
/**
 * POST /dating/uploads/presign
 * body: { count: number, contentTypes: string[] }
 * returns: { ok: true, items: [{objectKey, uploadUrl, contentType}] }
 */
router.post("/presign", async (req, res, next) => {
    try {
        const count = Math.min(3, Math.max(1, Number(req.body?.count || 3)));
        const contentTypes = Array.isArray(req.body?.contentTypes)
            ? req.body.contentTypes.map(String)
            : ["image/jpeg", "image/jpeg", "image/jpeg"];
        const items = await Promise.all([...Array(count)].map((_, i) => (0, storage_1.presignPhotoUpload)({
            userHint: (req.body?.userHint || "").toString().slice(0, 24) || "guest",
            contentType: contentTypes[i] || "image/jpeg",
        })));
        res.json({ ok: true, items });
    }
    catch (err) {
        console.error('Presign error:', err);
        next(err);
    }
});
exports.default = router;
