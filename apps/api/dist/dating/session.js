"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeSessionValue = makeSessionValue;
exports.parseSessionValue = parseSessionValue;
exports.setSessionCookie = setSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
exports.datingSessionMiddleware = datingSessionMiddleware;
const crypto_1 = require("crypto");
const COOKIE_NAME = process.env.DATING_SESSION_COOKIE_NAME || "dating_sess";
const SECRET = Buffer.from(process.env.SESSION_SECRET || "dev_session_secret");
const MAX_AGE = parseInt(process.env.DATING_SESSION_MAX_AGE_SECONDS || "2592000", 10); // 30d
function b64url(str) {
    return Buffer.from(str, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
function fromB64url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4)
        s += "=";
    return Buffer.from(s, "base64").toString("utf8");
}
function sign(val) {
    return (0, crypto_1.createHmac)("sha256", SECRET).update(val).digest("base64url");
}
function makeSessionValue(userId) {
    const payload = `${userId}`; // keep it dead simple
    const v = b64url(payload);
    const sig = sign(v);
    return `${v}.${sig}`;
}
function parseSessionValue(val) {
    if (!val)
        return null;
    const [v, sig] = val.split(".");
    if (!v || !sig)
        return null;
    if (sign(v) !== sig)
        return null;
    try {
        const userId = fromB64url(v);
        return userId || null;
    }
    catch {
        return null;
    }
}
function setSessionCookie(res, userId) {
    const value = makeSessionValue(userId);
    const secure = process.env.NODE_ENV === "production";
    const cookie = [
        `${COOKIE_NAME}=${value}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
        `Max-Age=${MAX_AGE}`,
        secure ? `Secure` : ``,
    ]
        .filter(Boolean)
        .join("; ");
    res.setHeader("Set-Cookie", cookie);
}
function clearSessionCookie(res) {
    const secure = process.env.NODE_ENV === "production";
    const cookie = [
        `${COOKIE_NAME}=;`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
        `Max-Age=0`,
        `Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        secure ? `Secure` : ``,
    ]
        .filter(Boolean)
        .join("; ");
    res.setHeader("Set-Cookie", cookie);
}
/** Optional middleware to read session; attaches req.datingUserId if present */
function datingSessionMiddleware(req, _res, next) {
    const raw = req.headers.cookie || "";
    const map = new Map();
    raw.split(";").forEach((p) => {
        const i = p.indexOf("=");
        if (i > -1)
            map.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
    });
    const userId = parseSessionValue(map.get(COOKIE_NAME));
    req.datingUserId = userId || null;
    next();
}
