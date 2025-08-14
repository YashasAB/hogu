
import { Router } from 'express';
import { Client } from '@replit/object-storage';

const router = Router();

const storageClient = new Client();

// Serve images from Object Storage
router.get('/*', async (req, res) => {
  console.log('=== IMAGE REQUEST RECEIVED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.path);
  console.log('Request params:', req.params);
  console.log('Request headers:', req.headers);
  console.log('================================');
  
  try {
    // Extract the path after /api/images/ by removing the route prefix
    let imagePath = req.path.slice(1); // Remove leading slash
    
    console.log(`Attempting to serve image: ${imagePath}`);
    console.log(`Full request URL: ${req.url}`);
    console.log(`Request params:`, req.params);
    
    // If the path starts with https://, it's already a full URL - redirect to it
    if (imagePath.startsWith('https://')) {
      return res.redirect(imagePath);
    }
    
    // Clean up the path - remove any leading slashes
    imagePath = imagePath.replace(/^\/+/, '');
    
    if (!imagePath) {
      return res.status(400).json({ error: 'No image path provided' });
    }
    
    console.log(`Cleaned image path: ${imagePath}`);
    
    // Try to serve from Object Storage
    const result = await storageClient.downloadAsBytes(imagePath);
    
    if (!result.ok) {
      console.error('Failed to download image from storage:', result.error);
      console.error('Attempted path:', imagePath);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate content type based on file extension
    const extension = imagePath.split('.').pop()?.toLowerCase();
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
