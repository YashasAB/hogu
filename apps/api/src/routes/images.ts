import { Router, Request, Response } from 'express';

const router = Router();

// Direct redirect to Replit Object Storage URL
router.get('/storage/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0]; // Get everything after /storage/

    if (!filePath) {
      console.log('❌ No file path provided');
      return res.status(400).json({ error: 'File path is required' });
    }

    console.log(`📁 Redirecting to direct storage URL for: ${filePath}`);

    // Construct the direct Replit Object Storage URL
    const encodedPath = encodeURIComponent(filePath);
    const directUrl = `https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/${encodedPath}?alt=media`;

    console.log(`✅ Redirecting to: ${directUrl}`);

    // Redirect to the direct storage URL
    res.redirect(302, directUrl);
  } catch (error) {
    console.error('❌ Error redirecting to storage URL:', error);
    res.status(500).json({ error: 'Failed to redirect to image' });
  }
});

export default router;