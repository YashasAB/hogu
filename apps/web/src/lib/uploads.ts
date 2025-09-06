import { postJson } from "./api";

type PresignItem = { objectKey: string; uploadUrl: string; contentType: string };

export async function presignPhotos(files: File[]) {
  const contentTypes = files.map((f) => f.type || "image/jpeg");
  const resp = await postJson<{ ok: true; items: PresignItem[] }>(
    "/dating/uploads/presign",
    { count: files.length, contentTypes, userHint: "signup" }
  );
  return resp.items;
}

export async function putToPresignedUrl(url: string, file: File, contentType: string) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
  if (!res.ok) throw new Error("Upload failed");
}