import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

// Initialize S3 client for Replit Object Storage
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.REPLIT_OBJSTORE_URL!,
  credentials: {
    accessKeyId: process.env.REPLIT_OBJSTORE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.REPLIT_OBJSTORE_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = 'replit-objstore-5d4a1c81-2e13-484c-92e0-96c3c7f4803f';

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
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    ContentType: opts.contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return { 
    objectKey, 
    uploadUrl, 
    contentType: opts.contentType 
  };
}

export async function getPhotoUrl(objectKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export { s3Client as storageClient };