import { isNative } from "./tokenStorage";

let initialized = false;

export async function initOneSignalAndRegister(): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string;
  if (!appId) return;

  try {
    const OneSignalModule = await import("onesignal-cordova-plugin");
    const OneSignal = OneSignalModule.default || OneSignalModule;

    OneSignal.initialize(appId);
    OneSignal.Notifications.requestPermission(true);

    const subId = OneSignal.User?.pushSubscription?.id;
    if (subId) {
      await postOneSignalId(subId);
    }

    OneSignal.User?.pushSubscription?.addEventListener("change", (change: { current?: { id?: string | null } }) => {
      const newId = change?.current?.id;
      if (newId) {
        postOneSignalId(newId);
      }
    });
  } catch (err) {
    console.error("[OneSignal] Initialization error:", err);
  }
}

async function postOneSignalId(oneSignalId: string): Promise<void> {
  try {
    await fetch("/api/dating/profile/onesignal-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ oneSignalId }),
    });
  } catch (err) {
    console.error("[OneSignal] Failed to post subscription ID:", err);
  }
}
