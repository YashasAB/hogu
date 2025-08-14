
import { Router } from 'express';
import { Client } from '@replit/object-storage';

const router = Router();

const storageClient = new Client();

// Serve images from Object Storage
router.get('/*', async (req, res) => {
  try {
    const path = req.url.slice(1); // Get the full path after /api/images/ (remove leading slash)
    
    console.log(`Attempting to serve image: ${path}`);
    
    // If the path starts with https://, it's already a full URL - redirect to it
    if (path.startsWith('https://')) {
      return res.redirect(path);
    }
    
    // Otherwise, try to serve from Object Storage
    const result = await storageClient.downloadAsBytes(path);
    
    if (!result.ok) {
      console.error('Failed to download image:', result.error);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate content type based on file extension
    const extension = path.split('.').pop()?.toLowerCase();
    let contentType = 'image/jpeg'; // default
    
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
    }
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(result.value);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

export default router;
