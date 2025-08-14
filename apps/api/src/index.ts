import express from "express";
import cors from "cors";
import path from "path";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import discoverRoutes from "./routes/discover";
import restaurantRoutes from "./routes/restaurants";
import reservationRoutes from "./routes/reservations";
import adminRoutes from "./routes/admin";
import imagesRouter from "./routes/images";
import multer from "multer"; // Import multer

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

testDatabaseConnection();

const app = express();
const PORT = Number(process.env.PORT) || 8080;

console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
console.log("REPL_ID set:", !!process.env.REPL_ID);
if (process.env.REPL_ID) {
  console.log("REPL_ID:", process.env.REPL_ID);
}

// Set DATABASE_URL if not present (for deployment)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

app.set("trust proxy", true);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// Multer configuration for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Health check endpoint for deployment
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hogu API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || "development",
  });
});

// Additional health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      port: PORT,
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness check endpoint
app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes first
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imagesRouter);

// Image proxy route for Replit storage - downloads and serves image bytes
app.get("/api/images/storage/:replId/:filename", async (req, res) => {
  try {
    const { replId, filename } = req.params;
    const filePath = `${replId}/${filename}`;

    console.log(`=== IMAGE PROXY REQUEST ===`);
    console.log(`Request path: ${req.path}`);
    console.log(`Downloading file: ${filePath}`);

    // Import the Object Storage client
    const { Client } = await import("@replit/object-storage");
    const storageClient = new Client();

    // Download the image as bytes
    const { ok, value: bytesValue, error } = await storageClient.downloadAsBytes(filePath);

    if (!ok) {
      console.error(`❌ Failed to download image: ${filePath}`, error);
      return res.status(404).send("Image not found");
    }

    console.log(`✅ Successfully downloaded image: ${filePath}`);

    // Determine content type based on file extension
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
    console.error("Error downloading image:", error);
    res.status(500).send("Error loading image");
  }
});

// Placeholder image route
app.get("/api/placeholder/:width/:height", (req, res) => {
  const { width, height } = req.params;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#374151"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="16">
        ${width}×${height}
      </text>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.send(svg);
});

// Serve static files and SPA in production (after all API routes)
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  const webDistPath = path.join(__dirname, "../../web/dist");
  app.use(express.static(webDistPath, { index: false }));
  console.log("Serving static files from:", webDistPath);
  
  // SPA fallback - only for non-API routes
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Hogu API listening on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

// Temporary endpoint to serve image test HTML
app.get("/testimg", (req, res) => {
  const replId = process.env.REPL_ID || "not-set"; // Fallback for debugging
  res.setHeader("Content-Type", "text/html");
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
            <div class="url">https://replit.com/object-storage/storage/v1/b/replit-objstore-${replId}/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media</div>
            <div id="status1" class="status info">Loading...</div>
            <img id="img1" src="https://replit.com/object-storage/storage/v1/b/replit-objstore-${replId}/o/cme996hfm000bj4h1cu57rrca%2FheroImage.jpg?alt=media" 
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
            <h2>📋 Server Info</h2>
            <div class="info">
                <p><strong>Port:</strong> ${PORT}</p>
                <p><strong>Environment:</strong> ${process.env.NODE_ENV || "development"}</p>
                <p><strong>REPL_ID:</strong> ${replId}</p>
                <p><strong>Current URL:</strong> ${req.get("host")}</p>
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
                // Log additional error details
                fetch('/api/images/storage/cme996hfm000bj4h1cu57rrca/heroImage.jpg')
                    .then(response => response.text())
                    .then(text => console.error('Server response:', text))
                    .catch(err => console.error('Fetch error:', err));
            }

            // Test fetch API for proxy endpoint
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
    </html>`);
});

// Test endpoint to check database image URLs
app.get("/test-db-images", async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        heroImageUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        heroImageUrl: true,
      },
      take: 5,
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
            .status { padding: 10px; margin: 10px 0; border-radius: 4px; font-weight: bold; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        </style>
    </head>
    <body>
        <h1>🍽️ Database Images Test</h1>
    `;

    restaurants.forEach((restaurant, index) => {
      html += `
        <div class="restaurant">
          <h3>${restaurant.name}</h3>
          <div class="url">${restaurant.heroImageUrl}</div>
          <div id="status${index}" class="status info">Loading...</div>
          <img src="${restaurant.heroImageUrl}" alt="${restaurant.name}" 
               onload="showSuccess('status${index}', 'Image for ${restaurant.name} loaded successfully!')"
               onerror="showError('status${index}', 'Image for ${restaurant.name} failed to load')" />
        </div>
      `;
    });

    html += `
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
    </html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database test failed' });
  }
});

// General upload endpoint (public)
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Accept only images
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Only image uploads are allowed" });
    }

    console.log(`Uploading public image: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

    // Generate unique filename for public uploads
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop() || 'jpg';
    const filename = `test-${timestamp}.${ext}`;
    const objectKey = `test-uploads/${filename}`;

    // Upload to storage
    const { Client } = await import("@replit/object-storage");
    const storageClient = new Client();
    const uploadResult = await storageClient.uploadFromBytes(objectKey, file.buffer, {});

    if (!uploadResult.ok) {
      console.error("Storage upload failed:", uploadResult.error);
      return res.status(500).json({ error: "Storage upload failed", details: uploadResult.error });
    }

    // Use our proxy URL pattern
    const imageUrl = `/api/images/storage/${objectKey}`;
    console.log(`✅ Test image uploaded successfully: ${imageUrl}`);

    return res.json({
      message: "Upload successful",
      url: imageUrl,
      filename: filename,
      size: file.size,
      mimetype: file.mimetype
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Catch-all route for images that handles various URL patterns
app.get("/api/images/*", async (req, res) => {
  try {
    console.log("=== CATCH-ALL IMAGE REQUEST ===");
    console.log("Full path:", req.path);
    console.log("Original URL:", req.originalUrl);

    let imagePath = req.path.replace("/api/images/", "");

    // Remove storage/ prefix if present
    if (imagePath.startsWith("storage/")) {
      imagePath = imagePath.replace("storage/", "");
    }

    // If it's a full URL, redirect to it
    if (imagePath.startsWith("https://")) {
      console.log("Redirecting to external URL:", imagePath);
      return res.redirect(imagePath);
    }

    console.log("Cleaned image path:", imagePath);

    // Prioritize the most likely Replit object storage URL
    const baseUrl = `https://replit.com/object-storage/storage/v1/b/replit-objstore-${process.env.REPL_ID || "not-set"}/o`;
    const storageUrl = `${baseUrl}/${encodeURIComponent(imagePath)}?alt=media`;

    console.log("Attempting to fetch from:", storageUrl);
    const response = await fetch(storageUrl);

    if (!response.ok) {
      console.error(
        `❌ Failed to fetch from ${storageUrl}: ${response.status} ${response.statusText}`,
      );
      return res.status(404).send("Image not found");
    }

    // Get the content type from the response
    const contentType = response.headers.get("content-type") || "image/jpeg";
    console.log("Content-Type:", contentType);
    console.log("Successfully served image from:", storageUrl);

    // Set appropriate headers
    res.set({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*",
    });

    // Pipe the image data to the response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Error in catch-all image route:");
    res.status(500).send("Error loading image");
  }
});