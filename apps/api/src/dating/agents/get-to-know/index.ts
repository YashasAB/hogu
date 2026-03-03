import prisma from "../../../prismaClient";
import { buildGetToKnowInput } from "./buildInput";
import { runGetToKnowGenerator } from "./generator";


const DAILY_LIMIT = 5;

export class GetToKnowLimitError extends Error {
  constructor() {
    super("Daily message limit reached");
    this.name = "GetToKnowLimitError";
  }
}

export async function runGetToKnow(
  userId: string,
  userMessage: string
): Promise<{ reply: string | null; dailyRemaining: number }> {
  const input = await buildGetToKnowInput(userId);

  if (input.todayUserCount >= DAILY_LIMIT) {
    throw new GetToKnowLimitError();
  }

  const { reply, profilePatch } = await runGetToKnowGenerator(userMessage, input);

  const agentContent = reply ?? "";

  const ops: any[] = [
    prisma.getToKnowMessage.create({
      data: { userId, role: "user", content: userMessage },
    }),
    prisma.getToKnowMessage.create({
      data: { userId, role: "agent", content: agentContent },
    }),
  ];

  if (Object.keys(profilePatch).length > 0) {
    ops.push(
      prisma.datingUser.update({
        where: { id: userId },
        data: profilePatch,
      })
    );
  }

  await prisma.$transaction(ops);

  const dailyRemaining = Math.max(0, DAILY_LIMIT - (input.todayUserCount + 1));
  return { reply, dailyRemaining };
}

export async function getGetToKnowStatus(userId: string): Promise<{
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
}> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = await prisma.getToKnowMessage.count({
    where: { userId, role: "user", createdAt: { gte: todayStart } },
  });

  return {
    dailyUsed: count,
    dailyLimit: DAILY_LIMIT,
    dailyRemaining: Math.max(0, DAILY_LIMIT - count),
  };
}
