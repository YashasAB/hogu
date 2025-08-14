import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import discoverRoutes from './routes/discover';
import restaurantRoutes from './routes/restaurants';
import reservationRoutes from './routes/reservations';
import adminRoutes from './routes/admin';
import imagesRouter from './routes/images';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testDatabaseConnection();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('REPL_ID set:', !!process.env.REPL_ID);
if (process.env.REPL_ID) {
  console.log('REPL_ID:', process.env.REPL_ID);
}

// Set DATABASE_URL if not present (for deployment)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static files from React build in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const webDistPath = path.join(__dirname, '../../web/dist');
  app.use(express.static(webDistPath));
  console.log('Serving static files from:', webDistPath);
}

// Health check endpoint for deployment
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hogu API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Additional health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      port: PORT
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imagesRouter);

// Image proxy route for Replit storage - handles both old and new URL formats
app.get('/api/images/storage/:replId/:filename', async (req, res) => {
  try {
    const { replId, filename } = req.params;
    
    console.log(`=== IMAGE PROXY REQUEST ===`);
    console.log(`Request path: ${req.path}`);
    console.log(`replId: ${replId}, filename: ${filename}`);
    
    // Try multiple storage URL formats
    const storageUrls = [
      // Direct Object Storage format (current preferred format)
      `https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/${encodeURIComponent(replId + '/' + filename)}?alt=media`,
      // Legacy storage format
      `https://storage.replit.com/${process.env.REPL_ID}/${replId}/${filename}`,
      // Alternative bucket format
      `https://storage.replit.com/${replId}/${filename}`
    ];

    let response = null;
    let usedUrl = '';

    for (const storageUrl of storageUrls) {
      console.log(`Trying: ${storageUrl}`);
      try {
        response = await fetch(storageUrl);
        if (response.ok) {
          usedUrl = storageUrl;
          console.log(`✅ Success with: ${storageUrl}`);
          break;
        } else {
          console.log(`❌ Failed with ${response.status}: ${storageUrl}`);
        }
      } catch (err) {
        console.log(`❌ Error with: ${storageUrl}`, err.message);
      }
    }

    if (!response || !response.ok) {
      console.error(`All storage URLs failed for ${replId}/${filename}`);
      return res.status(404).send('Image not found');
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Access-Control-Allow-Origin': '*',
    });

    // Pipe the image data to the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).send('Error loading image');
  }
});

// Temporary endpoint to serve image test HTML
app.get('/testimg', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Image Test - Enhanced Debug</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .test { 
                margin: 20px 0; 
                padding: 20px; 
                border: 2px solid #ddd; 
                background: white; 
                border-radius: 8px;
            }
            img { 
                max-width: 500px; 
                border: 2px solid #ccc; 
                margin: 10px 0; 
                display: block;
            }
            .url { 
                background: #f0f0f0; 
                padding: 10px; 
                word-break: break-all; 


// Test endpoint to check database image URLs
app.get('/test-db-images', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        heroImageUrl: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        heroImageUrl: true
      },
      take: 5
    });

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Images Test</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .restaurant { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            img { max-width: 300px; height: 200px; object-fit: cover; margin: 10px 0; }
            .url { background: #f5f5f5; padding: 8px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <h1>🍽️ Database Images Test</h1>
    `;

    restaurants.forEach(restaurant => {
      html += `
        <div class="restaurant">
          <h3>${restaurant.name}</h3>
          <div class="url">${restaurant.heroImageUrl}</div>
          <img src="${restaurant.heroImageUrl}" alt="${restaurant.name}" 
               onload="console.log('✅ Loaded: ${restaurant.name}')"
               onerror="console.log('❌ Failed: ${restaurant.name}', this.src)" />
        </div>
      `;
    });

    html += `
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database test failed' });
  }
});

                font-family: monospace;
                border-radius: 4px;
                margin: 10px 0;
            }
            .status {
                padding: 10px;
                margin: 10px 0;
                border-radius: 4px;
                font-weight: bold;
            }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        </style>
    </head>
    <body>
        <h1>🖼️ Enhanced Image Test - Object Storage Debug</h1>

        <div class="test">
            <h2>Test 1: Direct Object Storage URL</h2>
            <div class="url">https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media</div>
            <div id="status1" class="status info">Loading...</div>
            <img id="img1" src="https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media" 
                 onload="showSuccess('status1', 'Direct URL loaded successfully!')" 
                 onerror="showError('status1', 'Direct URL failed to load')" />
        </div>

        <div class="test">
            <h2>Test 2: Via API Proxy</h2>
            <div class="url">/api/images/storage/cme996hfm000bj4h1cu57rrca/heroImage.jpg</div>
            <div id="status2" class="status info">Loading...</div>
            <img id="img2" src="/api/images/storage/cme996hfm000bj4h1cu57rrca/heroImage.jpg" 
                 onload="showSuccess('status2', 'Proxy URL loaded successfully!')" 
                 onerror="showError('status2', 'Proxy URL failed to load')" />
        </div>

        <div class="test">
            <h2>Test 3: Alternative Direct Format</h2>
            <div class="url">https://replit.com/object-storage/storage/v1/b/replit-objstore-${process.env.REPL_ID || 'a5596f5b-0e64-44d2-9f7e-86e86ceed4ae'}/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media</div>
            <div id="status3" class="status info">Loading...</div>
            <img id="img3" src="https://replit.com/object-storage/storage/v1/b/replit-objstore-${process.env.REPL_ID || 'a5596f5b-0e64-44d2-9f7e-86e86ceed4ae'}/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media" 
                 onload="showSuccess('status3', 'Alternative direct URL loaded successfully!')" 
                 onerror="showError('status3', 'Alternative direct URL failed to load')" />
        </div>

        <div class="test">
            <h2>📋 Server Info</h2>
            <div class="info">
                <p><strong>Port:</strong> ${PORT}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>REPL_ID:</strong> ${process.env.REPL_ID || 'not set'}</p>
                <p><strong>Current URL:</strong> ${req.get('host')}</p>
            </div>
        </div>

        <script>
            function showSuccess(statusId, message) {
                const status = document.getElementById(statusId);
                status.className = 'status success';
                status.textContent = '✅ ' + message;
                console.log('✅', message);
            }

            function showError(statusId, message) {
                const status = document.getElementById(statusId);
                status.className = 'status error';
                status.textContent = '❌ ' + message;
                console.error('❌', message);
            }

            // Test fetch API as well
            setTimeout(() => {
                console.log('🔍 Testing fetch API for proxy endpoint...');
                fetch('/api/images/storage/cme996hfm000bj4h1cu57rrca/heroImage.jpg')
                    .then(response => {
                        console.log('Fetch response status:', response.status);
                        console.log('Fetch response headers:', [...response.headers.entries()]);
                        return response.blob();
                    })
                    .then(blob => {
                        console.log('Fetch successful, blob size:', blob.size, 'type:', blob.type);
                    })
                    .catch(error => {
                        console.error('Fetch failed:', error);
                    });
            }, 2000);
        </script>
    </body>
    </html>
  `);
});


// Catch-all route for images that handles various URL patterns
app.get('/api/images/*', async (req, res) => {
  try {
    console.log('=== CATCH-ALL IMAGE REQUEST ===');
    console.log('Full path:', req.path);
    console.log('Original URL:', req.originalUrl);

    let imagePath = req.path.replace('/api/images/', '');

    // If it starts with storage/, remove that prefix
    if (imagePath.startsWith('storage/')) {
      imagePath = imagePath.replace('storage/', '');
    }

    // If it's already a full https URL, redirect to it
    if (imagePath.startsWith('https://')) {
      console.log('Redirecting to external URL:', imagePath);
      return res.redirect(imagePath);
    }

    console.log('Cleaned image path:', imagePath);

    // Try multiple storage URL formats
    const storageUrls = [
      // Direct Object Storage format with current bucket
      `https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/${encodeURIComponent(imagePath)}?alt=media`,
      // Direct Object Storage format with REPL_ID bucket
      `https://replit.com/object-storage/storage/v1/b/replit-objstore-${process.env.REPL_ID}/o/${encodeURIComponent(imagePath)}?alt=media`,
      // Legacy storage format with current bucket
      `https://storage.replit.com/0a421abc-4a91-43c3-a052-c47f2fa08f7a/${imagePath}`,
      // Legacy storage format with REPL_ID bucket
      `https://storage.replit.com/${process.env.REPL_ID}/${imagePath}`,
      // Alternative bucket format
      `https://storage.replit.com/a5596f5b-0e64-44d2-9f7e-86e86ceed4ae/${imagePath}`
    ];

    let response = null;
    let usedUrl = '';

    for (const storageUrl of storageUrls) {
      console.log('Attempting to fetch from:', storageUrl);
      try {
        response = await fetch(storageUrl);
        if (response.ok) {
          usedUrl = storageUrl;
          console.log('✅ Successfully fetched image from:', storageUrl);
          break;
        } else {
          console.error(`❌ Failed to fetch from ${storageUrl}: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        console.error(`❌ Error fetching from ${storageUrl}:`, err.message);
      }
      response = null; // Reset response if not ok
    }

    if (!response || !response.ok) {
      console.error('Image not found in any storage location for path:', imagePath);
      return res.status(404).send('Image not found');
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('Content-Type:', contentType);
    console.log('Successfully served image from:', usedUrl);

    // Set appropriate headers
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Access-Control-Allow-Origin': '*',
    });

    // Pipe the image data to the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('Error in catch-all image route:', error);
    res.status(500).send('Error loading image');
  }
});


// Placeholder image route
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#374151"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="16">
        ${width}×${height}
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.send(svg);
});

// In production, serve the React app for all non-API routes
if (isProduction) {
  app.get('*', (req, res) => {
    const webDistPath = path.join(__dirname, '../../web/dist');
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hogu API listening on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});