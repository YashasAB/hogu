import prisma from "../../../prismaClient";
import { buildIntroInput } from "./buildInput";
import { generateIntroMessages } from "./generator";


function formatMessageContent(title: string, body: string, cta: string): string {
  return [body, cta].filter(Boolean).join("\n\n");
}

export async function runIntroAgent(matchId: string): Promise<void> {
  try {
    const input = await buildIntroInput(matchId);

    const output = await generateIntroMessages(input);

    const userA = input.users[0];
    const userB = input.users[1];

    const femaleUser = [userA, userB].find((u) => u.profile.Gender === "Female");
    const maleUser = [userA, userB].find((u) => u.profile.Gender !== "Female");

    if (!femaleUser || !maleUser) {
      console.warn(`[IntroAgent] Match ${matchId}: could not identify female/male user pair. Delivering both messages immediately.`);
      for (const msg of output.messages) {
        const content = formatMessageContent(msg.title, msg.body, msg.cta);
        await prisma.matchMessage.create({
          data: { matchId, userId: msg.to_user_id, fromAdmin: true, content },
        });
      }
      return;
    }

    const femaleMessage = output.messages.find((m) => m.to_user_id === femaleUser.user_id);
    const maleMessage = output.messages.find((m) => m.to_user_id === maleUser.user_id);

    if (femaleMessage) {
      const content = formatMessageContent(femaleMessage.title, femaleMessage.body, femaleMessage.cta);
      await prisma.matchMessage.create({
        data: { matchId, userId: femaleMessage.to_user_id, fromAdmin: true, content },
      });
      console.log(`[IntroAgent] Match ${matchId}: intro message delivered to female user ${femaleMessage.to_user_id}`);
    }

    if (maleMessage) {
      const content = formatMessageContent(maleMessage.title, maleMessage.body, maleMessage.cta);
      await prisma.pendingIntroMessage.upsert({
        where: { matchId },
        create: { matchId, toUserId: maleMessage.to_user_id, content },
        update: { toUserId: maleMessage.to_user_id, content },
      });
      console.log(`[IntroAgent] Match ${matchId}: intro message queued for male user ${maleMessage.to_user_id}`);
    }
  } catch (err) {
    console.error(`[IntroAgent] Match ${matchId}: agent failed —`, err);
  }
}

export async function deliverPendingIntroToMale(matchId: string): Promise<void> {
  try {
    const pending = await prisma.pendingIntroMessage.findUnique({
      where: { matchId },
    });

    if (!pending) {
      console.log(`[IntroAgent] Match ${matchId}: no pending intro message found for male delivery.`);
      return;
    }

    await prisma.matchMessage.create({
      data: { matchId: pending.matchId, userId: pending.toUserId, fromAdmin: true, content: pending.content },
    });

    await prisma.pendingIntroMessage.delete({ where: { matchId } });

    console.log(`[IntroAgent] Match ${matchId}: pending intro delivered to male user ${pending.toUserId}`);
  } catch (err) {
    console.error(`[IntroAgent] Match ${matchId}: failed to deliver pending intro —`, err);
  }
}

export async function deletePendingIntro(matchId: string): Promise<void> {
  try {
    await prisma.pendingIntroMessage.deleteMany({ where: { matchId } });
    console.log(`[IntroAgent] Match ${matchId}: pending intro message deleted (unmatch/cleanup).`);
  } catch (err) {
    console.error(`[IntroAgent] Match ${matchId}: failed to delete pending intro —`, err);
  }
}
