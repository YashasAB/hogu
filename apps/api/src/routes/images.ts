
import { Router } from 'express';
import { Client } from '@replit/object-storage';

const router = Router();

const storageClient = new Client();

// Serve images from Object Storage
router.get('/:restaurantId/:filename', async (req, res) => {
  try {
    const { restaurantId, filename } = req.params;
    const filePath = `${restaurantId}/${filename}`;
    
    console.log(`Attempting to serve image: ${filePath}`);
    
    const result = await storageClient.downloadAsBytes(filePath);
    
    if (!result.ok) {
      console.error('Failed to download image:', result.error);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
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
    res.send(Buffer.from(result.value));
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

export default router;
