import prisma from "../../prismaClient";

const ONESIGNAL_APP_ID = process.env.VITE_ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";

export async function sendPushToUser(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;

  try {
    const user = await prisma.datingUser.findUnique({
      where: { id: userId },
      select: { oneSignalId: true },
    });

    if (!user?.oneSignalId) return;

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_subscription_ids: [user.oneSignalId],
        headings: { en: title },
        contents: { en: message },
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Push] OneSignal error for user ${userId}:`, res.status, body);
    }
  } catch (err) {
    console.error(`[Push] Failed to send push to user ${userId}:`, err);
  }
}
