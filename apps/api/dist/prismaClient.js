"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const client_1 = require("@prisma/client");
function buildDatasourceUrl() {
    const base = process.env.DATABASE_URL;
    if (!base)
        throw new Error("DATABASE_URL is not set");
    const url = new URL(base);
    url.searchParams.set("connection_limit", "2");
    url.searchParams.set("idle_timeout", "5");
    return url.toString();
}
const prisma = new client_1.PrismaClient({
    datasourceUrl: buildDatasourceUrl(),
    log: [
        { emit: "event", level: "error" },
        { emit: "stdout", level: "warn" },
    ],
});
prisma.$on("error", (e) => {
    if (e.message.includes("E57P01"))
        return;
    console.error("[Prisma]", e.message);
});
exports.default = prisma;
function isConnectionError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (msg.includes("E57P01") ||
        msg.includes("P1001") ||
        msg.includes("P1008") ||
        msg.includes("P1017") ||
        msg.includes("Connection refused") ||
        msg.includes("Server has closed the connection"));
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(fn, retries = 3, delayMs = 600) {
    try {
        return await fn();
    }
    catch (err) {
        if (retries > 0 && isConnectionError(err)) {
            await sleep(delayMs);
            return withRetry(fn, retries - 1, delayMs);
        }
        throw err;
    }
}
