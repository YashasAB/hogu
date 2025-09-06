"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto_1 = require("crypto");
const util_1 = require("util");
const scrypt = (0, util_1.promisify)(crypto_1.scrypt);
// format: scrypt:<saltB64url>:<N>:<r>:<p>:<keylen>:<hashB64url>
const N = 16384, r = 8, p = 1, keylen = 64;
function b64url(buf) {
    return buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}
function fromB64url(s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4)
        s += "=";
    return Buffer.from(s, "base64");
}
async function hashPassword(plain) {
    if (!plain || plain.length < 8)
        throw new Error("Password must be at least 8 characters");
    const salt = (0, crypto_1.randomBytes)(16);
    const dk = (await scrypt(plain, salt, keylen));
    return `scrypt:${b64url(salt)}:${N}:${r}:${p}:${keylen}:${b64url(dk)}`;
}
async function verifyPassword(plain, stored) {
    const parts = stored.split(":");
    if (parts.length !== 7 || parts[0] !== "scrypt")
        return false;
    const [, saltStr, nStr, rStr, pStr, kStr, hashStr] = parts;
    const salt = fromB64url(saltStr);
    const Np = parseInt(nStr, 10), rp = parseInt(rStr, 10), pp = parseInt(pStr, 10), kp = parseInt(kStr, 10);
    const expected = fromB64url(hashStr);
    const dk = (await scrypt(plain, salt, kp));
    return (0, crypto_1.timingSafeEqual)(dk, expected);
}
