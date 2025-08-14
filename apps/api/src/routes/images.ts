import { Router, Request, Response } from 'express';
import { Client } from '@replit/object-storage';

const router = Router();

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
    const { ok, value: bytesValue, error } = await storageClient.downloadAsBytes(filePath);

    if (!ok) {
      console.error(`❌ Failed to download image: ${filePath}`, error);
      return res.status(404).json({ error: 'Image not found' });
    }

    console.log(`✅ Successfully downloaded image: ${filePath}`);

    // Determine content type based on file extension
    const filename = filePath.split('/').pop() || '';
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = "image/jpeg"; // default

    switch (ext) {
      case 'png':
        contentType = "image/png";
        break;
      case 'jpg':
      case 'jpeg':
        contentType = "image/jpeg";
        break;
      case 'gif':
        contentType = "image/gif";
        break;
      case 'webp':
        contentType = "image/webp";
        break;
      case 'svg':
        contentType = "image/svg+xml";
        break;
    }

    // Set appropriate headers
    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      "Access-Control-Allow-Origin": "*",
    });

    // Send the image bytes
    res.send(bytesValue);
  } catch (error) {
    console.error('❌ Error downloading image from storage:', error);
    res.status(500).json({ error: 'Failed to download image' });
  }
});

export default router;