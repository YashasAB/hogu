import { isNative } from "./tokenStorage";

let initialized = false;

export async function initOneSignalAndRegister(): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;
  // Push notifications are temporarily disabled.
  // onesignal-cordova-plugin was removed because it is incompatible with
  // Capacitor 6+ SPM integration and crashed cap sync ios.
  // Re-enable once a proper Capacitor-native OneSignal SDK is added and
  // restore the /api/dating/profile/onesignal-id registration call.
}
