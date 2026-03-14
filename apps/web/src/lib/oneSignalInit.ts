import { isNative } from "./tokenStorage";

declare global {
  interface Window {
    plugins?: {
      OneSignal?: {
        initialize(appId: string): void;
        Notifications: {
          requestPermission(): Promise<boolean>;
        };
        User: {
          pushSubscription: {
            id: string | null | undefined;
            addEventListener(event: string, callback: (change: { current: { id?: string | null } }) => void): void;
          };
        };
      };
    };
  }
}

let initialized = false;

export async function initOneSignalAndRegister(): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string;
  if (!appId) return;

  const maxWait = 5000;
  const start = Date.now();
  while (!window.plugins?.OneSignal && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 200));
  }

  const OneSignal = window.plugins?.OneSignal;
  if (!OneSignal) {
    console.warn("[OneSignal] Plugin not available");
    return;
  }

  try {
    OneSignal.initialize(appId);
    await OneSignal.Notifications.requestPermission();

    const subId = OneSignal.User.pushSubscription.id;
    if (subId) {
      await postOneSignalId(subId);
    }

    OneSignal.User.pushSubscription.addEventListener("change", (change) => {
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
