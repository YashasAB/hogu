
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
  console.log('================================');
  
  try {
    // Extract the path after /api/images/ by removing the route prefix
    let imagePath = req.path.slice(1); // Remove leading slash
    
    console.log(`Raw image path: ${imagePath}`);
    
    // If the path starts with https://, it's already a full URL - redirect to it
    if (imagePath.startsWith('https://')) {
      console.log('Redirecting to external URL:', imagePath);
      return res.redirect(imagePath);
    }
    
    // Clean up the path - remove any leading slashes
    imagePath = imagePath.replace(/^\/+/, '');
    
    // Remove 'storage/' prefix if it exists since files were uploaded without it
    imagePath = imagePath.replace(/^storage\//, '');
    
    if (!imagePath) {
      console.log('ERROR: No image path provided');
      return res.status(400).json({ error: 'No image path provided' });
    }
    
    console.log(`Final cleaned image path: ${imagePath}`);
    
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
    
    console.log(`Setting content type: ${contentType} for extension: ${extension}`);
    console.log(`Image data size: ${result.value.length} bytes`);
    
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.set('Content-Length', result.value.length.toString());
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.send(result.value);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Proxy route for Replit Object Storage images
router.get('/storage/*', async (req, res) => {
  try {
    // Extract the path after /storage/
    let imagePath = (req.params as any)[0];
    
    if (!imagePath) {
      return res.status(400).json({ error: 'No image path provided' });
    }
    
    // Remove 'storage/' prefix if it exists since the file was uploaded without it
    imagePath = imagePath.replace(/^storage\//, '');
    
    console.log(`Proxying storage image: ${imagePath}`);
    
    // Try to serve from Object Storage
    const result = await storageClient.downloadAsBytes(imagePath);
    
    if (!result.ok) {
      console.error('Failed to download image from storage:', result.error);
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Determine content type based on file extension
    const ext = imagePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(result.value);
    
  } catch (error) {
    console.error('Error proxying storage image:', error);
    res.status(500).json({ error: 'Failed to load image' });
  }
});

export default router;
