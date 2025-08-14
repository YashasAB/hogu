
import React, { useState, useEffect } from 'react';

const ImageDisplay = () => {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Move these to component state so they're accessible in JSX
  const replId = 'cme996hfm000bj4h1cu57rrca';
  const filename = 'heroImage.jpg';

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const startTime = Date.now();
        const imageUrl = `/api/images/storage/${replId}/${filename}`;
        
        console.log(`=== FRONTEND IMAGE FETCH START ===`);
        console.log(`🖼️ Attempting to fetch image from: ${imageUrl}`);
        console.log(`🔍 Full URL: ${window.location.origin}${imageUrl}`);
        console.log(`⏰ Fetch started at: ${new Date().toISOString()}`);
        console.log(`🌐 Current location: ${window.location.href}`);
        console.log(`👤 User agent: ${navigator.userAgent}`);
        
        // Use the API proxy endpoint we already have
        console.log(`📡 Initiating fetch request...`);
        const response = await fetch(imageUrl);
        
        const fetchTime = Date.now() - startTime;
        console.log(`⏱️ Fetch completed in ${fetchTime}ms`);
        console.log(`📡 Response received:`);
        console.log(`   - Status: ${response.status} (${response.statusText})`);
        console.log(`   - OK: ${response.ok}`);
        console.log(`   - Type: ${response.type}`);
        console.log(`   - URL: ${response.url}`);
        console.log(`   - Redirected: ${response.redirected}`);
        
        // Log all response headers
        console.log(`📋 Response headers:`);
        response.headers.forEach((value, key) => {
          console.log(`   - ${key}: ${value}`);
        });
        
        if (!response.ok) {
          console.error(`❌ Response not OK:`);
          console.error(`   - Status: ${response.status}`);
          console.error(`   - Status text: ${response.statusText}`);
          
          let errorText;
          try {
            errorText = await response.text();
            console.error(`   - Response body:`, errorText);
          } catch (textError) {
            console.error(`   - Could not read response text:`, textError);
            errorText = 'Could not read error response';
          }
          
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        console.log(`📦 Response details:`);
        console.log(`   - Content-Type: ${contentType}`);
        console.log(`   - Content-Length: ${contentLength}`);
        
        // Convert response to different formats for analysis
        console.log(`🔄 Converting response to blob...`);
        const blobStartTime = Date.now();
        const blob = await response.blob();
        const blobTime = Date.now() - blobStartTime;
        
        console.log(`🎯 Blob conversion completed in ${blobTime}ms:`);
        console.log(`   - Blob size: ${blob.size} bytes`);
        console.log(`   - Blob type: ${blob.type}`);
        console.log(`   - Blob constructor: ${blob.constructor.name}`);
        
        // Verify blob content
        if (blob.size === 0) {
          console.error(`❌ Blob is empty!`);
          throw new Error('Received empty blob');
        }
        
        // Try to read first few bytes of blob for verification
        console.log(`🔍 Reading blob content for verification...`);
        try {
          const arrayBuffer = await blob.slice(0, 16).arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const firstBytes = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join(' ');
          console.log(`   - First 16 bytes (hex): ${firstBytes}`);
          
          // Check file signature
          const signature = Array.from(uint8Array.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
          console.log(`   - File signature: ${signature}`);
          
          if (signature.startsWith('ffd8')) {
            console.log(`   - ✅ Valid JPEG signature detected in blob`);
          } else if (signature.startsWith('8950')) {
            console.log(`   - ✅ Valid PNG signature detected in blob`);
          } else {
            console.log(`   - ⚠️ Unknown file signature in blob`);
          }
        } catch (readError) {
          console.error(`❌ Could not read blob content:`, readError);
        }
        
        // Create object URL
        console.log(`🔗 Creating object URL...`);
        const objectUrlStartTime = Date.now();
        const objectUrl = URL.createObjectURL(blob);
        const objectUrlTime = Date.now() - objectUrlStartTime;
        
        console.log(`🔗 Object URL created in ${objectUrlTime}ms:`);
        console.log(`   - Object URL: ${objectUrl}`);
        console.log(`   - URL length: ${objectUrl.length}`);
        
        // Test if URL is valid
        console.log(`✅ Setting image source and completing fetch`);
        const totalTime = Date.now() - startTime;
        console.log(`⏱️ Total fetch process completed in ${totalTime}ms`);
        
        setImageSrc(objectUrl);
        setLoading(false);
        
        console.log(`✅ Image fetch successful!`);
        console.log(`=== FRONTEND IMAGE FETCH END ===\n`);
        
      } catch (err) {
        const totalTime = Date.now() - startTime;
        console.error(`💥 FRONTEND IMAGE FETCH FAILED after ${totalTime}ms:`);
        console.error(`   - Error message: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error(`   - Error type: ${typeof err}`);
        console.error(`   - Error stack:`, err instanceof Error ? err.stack : 'No stack trace');
        console.error(`   - Error object:`, err);
        console.error(`=== FRONTEND IMAGE FETCH ERROR END ===\n`);
        
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchImage();
    
    // Cleanup object URL on unmount
    return () => {
      if (imageSrc) {
        console.log(`🧹 Cleaning up object URL: ${imageSrc}`);
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [replId, filename]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Image from Replit Object Storage</h2>
      {loading && <p className="text-gray-600">Loading image...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {imageSrc && (
        <div className="space-y-4">
          <img
            src={imageSrc}
            alt="Restaurant Hero Image"
            className="max-w-full w-full h-80 object-cover border-2 border-gray-300 rounded-lg shadow-lg"
          />
          <div className="text-sm text-gray-500">
            <p>Image path: {replId}/{filename}</p>
            <p>Loaded via API proxy endpoint: /api/images/storage/{replId}/{filename}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;
