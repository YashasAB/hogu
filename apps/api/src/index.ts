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

// Image proxy route for Replit storage
app.get('/api/images/storage/:replId/:filename', async (req, res) => {
  try {
    const { replId, filename } = req.params;
    const storageUrl = `https://storage.replit.com/${process.env.REPL_ID}/${replId}/${filename}`;

    console.log(`Proxying image request: ${req.path} -> ${storageUrl}`);

    // Fetch the image from Replit storage
    const response = await fetch(storageUrl);

    if (!response.ok) {
      console.error(`Failed to fetch image from storage: ${response.status} ${response.statusText}`);
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
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temp Image Test - Object Storage</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .image-test {
            text-align: center;
            margin: 20px 0;
        }
        img {
            max-width: 100%;
            height: auto;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .url-display {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
            margin: 10px 0;
        }
        .status {
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Temp Image Test - Object Storage</h1>
        
        <div class="image-test">
            <h2>Direct Object Storage URL Test</h2>
            <div class="url-display">
                https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media
            </div>
            
            <img 
                id="directImage"
                src="https://replit.com/object-storage/storage/v1/b/replit-objstore-0a421abc-4a91-43c3-a052-c47f2fa08f7a/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media" 
                alt="Direct Object Storage Image Test"
                onload="showSuccess('directStatus', 'Direct URL loaded successfully!')"
                onerror="showError('directStatus', 'Direct URL failed to load')"
            />
            <div id="directStatus" class="status" style="display: none;"></div>
        </div>

        <div class="image-test">
            <h2>Via API Proxy Test</h2>
            <div class="url-display">
                /api/images/storage/cme996hfm000bj4h1cu57rrca/heroImage.jpg
            </div>
            
            <img 
                id="proxyImage"
                src="/api/images/storage/cme996hfm000bj4h1cu57rrca/heroImage.jpg" 
                alt="API Proxy Image Test"
                onload="showSuccess('proxyStatus', 'API proxy loaded successfully!')"
                onerror="showError('proxyStatus', 'API proxy failed to load')"
            />
            <div id="proxyStatus" class="status" style="display: none;"></div>
        </div>

        <div class="image-test">
            <h2>Image Details</h2>
            <div id="imageDetails" style="display: none;">
                <p><strong>Dimensions:</strong> <span id="dimensions"></span></p>
                <p><strong>Natural Dimensions:</strong> <span id="naturalDimensions"></span></p>
                <p><strong>Load Time:</strong> <span id="loadTime"></span></p>
            </div>
        </div>
    </div>

    <script>
        let loadStartTime = Date.now();

        function showSuccess(statusId, message) {
            const status = document.getElementById(statusId);
            status.className = 'status success';
            status.textContent = '✅ ' + message;
            status.style.display = 'block';
            
            if (statusId === 'directStatus') {
                const img = document.getElementById('directImage');
                showImageDetails(img);
            }
        }

        function showError(statusId, message) {
            const status = document.getElementById(statusId);
            status.className = 'status error';
            status.textContent = '❌ ' + message;
            status.style.display = 'block';
        }

        function showImageDetails(img) {
            const loadTime = Date.now() - loadStartTime;
            document.getElementById('dimensions').textContent = \`\${img.width} x \${img.height}\`;
            document.getElementById('naturalDimensions').textContent = \`\${img.naturalWidth} x \${img.naturalHeight}\`;
            document.getElementById('loadTime').textContent = \`\${loadTime}ms\`;
            document.getElementById('imageDetails').style.display = 'block';
        }

        // Test network connectivity
        console.log('=== TEMP IMAGE TEST STARTED ===');
        console.log('Testing object storage image visibility...');
        console.log('Direct URL:', document.getElementById('directImage').src);
        console.log('Proxy URL:', document.getElementById('proxyImage').src);
    </script>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
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

    // Try multiple bucket IDs for compatibility (current bucket first)
    const bucketIds = [
      process.env.REPL_ID || '0a421abc-4a91-43c3-a052-c47f2fa08f7a', // Current bucket (priority)
      'a5596f5b-0e64-44d2-9f7e-86e86ceed4ae'  // Original bucket (fallback)
    ];

    let response = null;
    let storageUrl = '';

    for (const bucketId of bucketIds) {
      storageUrl = `https://storage.replit.com/${bucketId}/${imagePath}`;
      console.log('Attempting to fetch from:', storageUrl);
      response = await fetch(storageUrl);
      if (response.ok) {
        console.log('✅ Successfully fetched image from storage');
        break;
      } else {
        console.error(`Failed to fetch image from ${storageUrl}: ${response.status} ${response.statusText}`);
        response = null; // Reset response if not ok
      }
    }

    if (!response || !response.ok) {
      console.error('Image not found in any bucket. Last attempted URL:', storageUrl);
      return res.status(404).send('Image not found');
    }

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('Content-Type:', contentType);

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