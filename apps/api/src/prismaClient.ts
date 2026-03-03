import { PrismaClient } from "@prisma/client";

function buildDatasourceUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL is not set");
  const url = new URL(base);
  url.searchParams.set("connection_limit", "2");
  url.searchParams.set("idle_timeout", "5");
  return url.toString();
}

const prisma = new PrismaClient({
  datasourceUrl: buildDatasourceUrl(),
  log: [
    { emit: "event", level: "error" },
    { emit: "stdout", level: "warn" },
  ],
});

prisma.$on("error", (e) => {
  if (e.message.includes("E57P01")) return;
  console.error("[Prisma]", e.message);
});

export default prisma;

function isConnectionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("E57P01") ||
    msg.includes("P1001") ||
    msg.includes("P1008") ||
    msg.includes("P1017") ||
    msg.includes("Connection refused") ||
    msg.includes("Server has closed the connection")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 600
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && isConnectionError(err)) {
      await sleep(delayMs);
      return withRetry(fn, retries - 1, delayMs);
    }
    throw err;
  }
}
