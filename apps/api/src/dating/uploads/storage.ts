import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function getBucketName(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  }
  return bucketId;
}

function extForContentType(ct: string): string {
  if (ct === "image/jpeg") return "jpg";
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  return "bin";
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}`
    );
  }

  const data = await response.json() as { signed_url: string };
  return data.signed_url;
}

export async function presignPhotoUpload(opts: { userHint?: string; contentType: string }) {
  const bucketName = getBucketName();
  const nonce = crypto.randomBytes(8).toString("hex");
  const id = crypto.randomUUID();
  const ext = extForContentType(opts.contentType);
  const objectKey = `dating/photos/pending/${opts.userHint || "anon"}/${nonce}/${id}.${ext}`;

  const uploadUrl = await signObjectURL({
    bucketName,
    objectName: objectKey,
    method: "PUT",
    ttlSec: 3600,
  });
  
  return { 
    objectKey, 
    uploadUrl, 
    contentType: opts.contentType 
  };
}

export async function getPhotoUrl(objectKey: string): Promise<string> {
  const bucketName = getBucketName();
  return await signObjectURL({
    bucketName,
    objectName: objectKey,
    method: "GET",
    ttlSec: 3600,
  });
}

export async function getPhotoStream(objectKey: string) {
  const bucketName = getBucketName();
  const bucket = storageClient.bucket(bucketName);
  const file = bucket.file(objectKey);
  
  const [exists] = await file.exists();
  if (!exists) {
    return null;
  }
  
  const [metadata] = await file.getMetadata();
  return {
    stream: file.createReadStream(),
    contentType: metadata.contentType || 'application/octet-stream',
    size: metadata.size,
  };
}

export { storageClient };
