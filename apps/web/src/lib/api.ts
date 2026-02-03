export const API_BASE = (globalThis as any).process?.env?.NEXT_PUBLIC_API_BASE || "";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let payload: any = null;
    try { payload = await res.json(); } catch {}
    const err: any = new Error(payload?.error || res.statusText);
    err.status = res.status; err.details = payload?.details;
    throw err;
  }
  return (await res.json()) as T;
}

/** POST JSON */
export function postJson<T>(path: string, body: any) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

/** GET JSON */
export function fetchJson<T>(path: string) {
  return api<T>(path, { method: "GET" });
}