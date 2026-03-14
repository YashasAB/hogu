import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'dating_token';

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function persistToken(token: string): Promise<void> {
  sessionStorage.setItem(TOKEN_KEY, token);
  if (isNative()) {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  }
}

export async function clearToken(): Promise<void> {
  sessionStorage.removeItem(TOKEN_KEY);
  if (isNative()) {
    await Preferences.remove({ key: TOKEN_KEY });
  }
}

export async function restoreToken(): Promise<string | null> {
  const existing = sessionStorage.getItem(TOKEN_KEY);
  if (existing) return existing;

  if (!isNative()) return null;

  const { value } = await Preferences.get({ key: TOKEN_KEY });
  if (value) {
    sessionStorage.setItem(TOKEN_KEY, value);
  }
  return value;
}
