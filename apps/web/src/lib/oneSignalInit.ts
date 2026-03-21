import { isNative } from "./tokenStorage";

let initialized = false;

export async function initOneSignalAndRegister(): Promise<void> {
  if (!isNative() || initialized) return;
  initialized = true;
}
