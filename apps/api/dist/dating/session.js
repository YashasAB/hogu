import { createHmac } from "crypto";

const COOKIE_NAME = process.env.DATING_SESSION_COOKIE_NAME || "dating_sess";
const SECRET = Buffer.from(process.env.SESSION_SECRET || "dev_session_secret");
const MAX_AGE = parseInt(
  process.env.DATING_SESSION_MAX_AGE_SECONDS || "2592000",
  10,
); // 30d

function b64url(str) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function fromB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64").toString("utf8");
}
function sign(val) {
  return createHmac("sha256", SECRET).update(val).digest("base64url");
}

export function makeSessionValue(userId) {
  const v = b64url(String(userId));
  const sig = sign(v);
  return `${v}.${sig}`;
}
export function parseSessionValue(val) {
  if (!val) return null;
  const [v, sig] = val.split(".");
  if (!v || !sig) return null;
  if (sign(v) !== sig) return null;
  try {
    const userId = fromB64url(v);
    return userId || null;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, userId) {
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

export function clearSessionCookie(res) {
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

export function datingSessionMiddleware(req, _res, next) {
  const raw = req.headers.cookie || "";
  const map = new Map();
  raw.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) map.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
  });
  const cookieVal = map.get(COOKIE_NAME);
  req.datingUserId = parseSessionValue(cookieVal);
  next();
}
