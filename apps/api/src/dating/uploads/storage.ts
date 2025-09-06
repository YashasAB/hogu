import { Client } from '@replit/object-storage';
import crypto from 'crypto';

// Initialize Replit Object Storage client
const client = new Client();

function extForContentType(ct: string): string {
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  return "bin";
}

export async function presignPhotoUpload(opts: { userHint?: string; contentType: string }) {
  const nonce = crypto.randomBytes(8).toString("hex");
  const id = crypto.randomUUID();
  const ext = extForContentType(opts.contentType);
  const objectKey = `dating/photos/pending/${opts.userHint || "anon"}/${nonce}/${id}.${ext}`;

  // Create a presigned URL for uploading
  const uploadUrl = await client.uploadUrl(objectKey);
  
  return { 
    objectKey, 
    uploadUrl, 
    contentType: opts.contentType 
  };
}

export async function getPhotoUrl(objectKey: string): Promise<string> {
  return await client.downloadUrl(objectKey);
}

export { client as storageClient };