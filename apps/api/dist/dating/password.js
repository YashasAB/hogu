import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
const scrypt = promisify(_scrypt);

// format: scrypt:<saltB64url>:<N>:<r>:<p>:<keylen>:<hashB64url>
const N = 16384,
  r = 8,
  p = 1,
  keylen = 64;

function b64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function fromB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

export async function hashPassword(plain) {
  if (!plain || plain.length < 8)
    throw new Error("Password must be at least 8 characters");
  const salt = randomBytes(16);
  const dk = await scrypt(plain, salt, keylen, { N, r, p });
  return `scrypt:${b64url(salt)}:${N}:${r}:${p}:${keylen}:${b64url(dk)}`;
}

export async function verifyPassword(plain, stored) {
  const parts = stored.split(":");
  if (parts.length !== 7 || parts[0] !== "scrypt") return false;
  const [, saltStr, nStr, rStr, pStr, kStr, hashStr] = parts;
  const salt = fromB64url(saltStr);
  const Np = parseInt(nStr, 10),
    rp = parseInt(rStr, 10),
    pp = parseInt(pStr, 10),
    kp = parseInt(kStr, 10);
  const expected = fromB64url(hashStr);
  const dk = await scrypt(plain, salt, kp, { N: Np, r: rp, p: pp });
  return timingSafeEqual(dk, expected);
}
