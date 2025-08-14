
import { Router, Request, Response } from 'express';
import { Client } from '@replit/object-storage';

const router = Router();

// Small helper: whatever comes back -> Node Buffer
function toNodeBuffer(v: unknown): Buffer {
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array) return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  if (Array.isArray(v) && v[0]) {
    const first = (v as any[])[0];
    if (Buffer.isBuffer(first)) return first;
    if (first instanceof Uint8Array) return Buffer.from(first.buffer, first.byteOffset, first.byteLength);
  }
  throw new Error("Unexpected storage value type");
}

// Minimal signature sniff (fallback to extension)
function detectContentType(buf: Buffer, filename: string): string {
  const hex4 = buf.subarray(0, 4).toString("hex");
  if (hex4.startsWith("ffd8")) return "image/jpeg";
  if (hex4 === "89504e47") return "image/png";
  if (buf.subarray(0,4).toString("ascii")==="RIFF" && buf.subarray(8,12).toString("ascii")==="WEBP") return "image/webp";
  if (hex4.startsWith("4749")) return "image/gif";
  if (filename.toLowerCase().endsWith(".svg")) return "image/svg+xml";
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

// Download and serve images from Replit Object Storage
router.get('/storage/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0]; // Get everything after /storage/

    if (!filePath) {
      console.log('❌ No file path provided');
      return res.status(400).json({ error: 'File path is required' });
    }

    console.log(`📁 Downloading image from storage: ${filePath}`);

    const storageClient = new Client();

    // Download the image as bytes
    const out: any = await storageClient.downloadAsBytes(filePath);

    if (!out?.ok || !out?.value) {
      console.error(`❌ Failed to download image: ${filePath}`, out?.error);
      return res.status(404).json({ error: 'Image not found', key: filePath, details: out?.error });
    }

    console.log(`✅ Successfully downloaded image: ${filePath}`);

    // Ensure we have raw binary
    const buf = toNodeBuffer(out.value);

    // Extract filename for content type detection
    const filename = filePath.split('/').pop() || '';
    
    // Pick the correct image/* (NO charset)
    const contentType = detectContentType(buf, filename);

    // Set headers explicitly. Do NOT use res.type()/res.contentType() (they can append charset).
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    // Ensure no conflicting header sneaks in from global CORS middleware:
    res.removeHeader?.("Access-Control-Allow-Credentials");

    // Let Express compute Content-Length; just send bytes
    return res.end(buf);
  } catch (error) {
    console.error('❌ Error downloading image from storage:', error);
    res.status(500).json({ error: 'Failed to download image' });
  }
});

// (Optional) HEAD – nice for CDNs/proxies
router.head('/storage/*', async (req: Request, res: Response) => {
  // You can reuse logic above to set headers without sending the body,
  // or simply 200 with cache headers if you don't need exact length.
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendStatus(200);
});

export default router;
