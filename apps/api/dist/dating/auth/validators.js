"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isE164 = isE164;
exports.requireSignupBody = requireSignupBody;
exports.requireLoginBody = requireLoginBody;
exports.requireSignupPassword = requireSignupPassword;
function isE164(phone) {
    return /^\+?[1-9]\d{7,14}$/.test(phone);
}
function requireSignupBody(body) {
    const errors = {};
    if (!body) {
        throw new Error("Body required");
    }
    const phone = (body.phone || body.phoneE164 || "").toString().trim();
    const password = (body.password || "").toString();
    const name = (body.name || "").toString().trim();
    const dob = (body.dob || "").toString().trim(); // YYYY-MM-DD
    if (!isE164(phone))
        errors.phone = "Valid phone (E.164) required";
    if (password.length < 8)
        errors.password = "Min 8 characters";
    if (!name)
        errors.name = "Name required";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob))
        errors.dob = "Use YYYY-MM-DD";
    if (Object.keys(errors).length) {
        const err = new Error("Validation failed");
        err.status = 400;
        err.details = errors;
        throw err;
    }
    // Validate photos
    const photosRaw = Array.isArray(body.photos) ? body.photos : [];
    const photos = photosRaw
        .map((p, i) => ({
        objectKey: String(p?.objectKey || ""),
        sortOrder: Number(p?.sortOrder ?? i),
    }))
        .filter((p) => p.objectKey);
    if (photos.length < 1) {
        errors.photos = "At least 1 photo objectKey required";
    }
    if (Object.keys(errors).length) {
        const err = new Error("Validation failed");
        err.status = 400;
        err.details = errors;
        throw err;
    }
    const pick = (k) => body[k] === undefined ? undefined : String(body[k]);
    const pickArray = (k) => {
        if (!Array.isArray(body[k]))
            return [];
        return body[k].filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim());
    };
    return {
        phoneE164: phone.startsWith("+") ? phone : `+${phone}`,
        password,
        name,
        dob,
        profession: pick("profession"),
        dreams: pick("dreams"),
        fiveYearGoal: pick("fiveYearGoal"),
        whatIWantInPartner: pick("whatIWantInPartner"),
        whyPartnerWouldLikeMe: pick("whyPartnerWouldLikeMe"),
        myDayLooksLike: pick("myDayLooksLike"),
        idealFirstDate: pick("idealFirstDate"),
        nonNegotiables: pick("nonNegotiables"),
        physicalActivity: pick("physicalActivity"),
        dateBudget: pick("dateBudget"),
        instagramHandle: pick("instagramHandle"),
        diet: pick("diet"),
        drinking: pick("drinking"),
        smoking: pick("smoking"),
        height: pick("height"),
        gender: pick("gender") || "Male",
        relationshipType: pick("relationshipType") || "serious",
        agePreferenceMin: body.agePreferenceMin !== undefined && body.agePreferenceMin !== null && body.agePreferenceMin !== "" ? parseInt(String(body.agePreferenceMin), 10) : null,
        agePreferenceMax: body.agePreferenceMax !== undefined && body.agePreferenceMax !== null && body.agePreferenceMax !== "" ? parseInt(String(body.agePreferenceMax), 10) : null,
        dateCity: pick("dateCity"),
        dateNeighborhoods: pick("dateNeighborhoods"),
        city: pick("city") || "BLR",
        photos,
        cuisines: pickArray("cuisines"),
        interests: pickArray("interests"),
        firstDateTypes: pickArray("firstDateTypes"),
        languages: pickArray("languages"),
    };
}
function requireLoginBody(body) {
    const errors = {};
    if (!body)
        throw new Error("Body required");
    const phone = (body.phone || body.phoneE164 || "").toString().trim();
    const password = (body.password || "").toString();
    const otp = (body.otp || "").toString().trim();
    if (!isE164(phone))
        errors.phone = "Valid phone required";
    if (Object.keys(errors).length) {
        const err = new Error("Validation failed");
        err.status = 400;
        err.details = errors;
        throw err;
    }
    return {
        phoneE164: phone.startsWith("+") ? phone : `+${phone}`,
        password,
        otp,
    };
}
function requireSignupPassword(body) {
    const password = (body.password || "").toString();
    if (password.length < 8) {
        const err = new Error("Validation failed");
        err.status = 400;
        err.details = { password: "Min 8 characters" };
        throw err;
    }
    return password;
}
