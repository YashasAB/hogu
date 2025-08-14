
import React, { useState, useEffect } from 'react';

const ImageDisplay = () => {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        // Use the API proxy endpoint we already have - split into replId and filename
        const replId = 'cme996hfm000bj4h1cu57rrca';
        const filename = 'heroImage.jpg';
        const response = await fetch(`/api/images/storage/${replId}/${filename}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        // Convert response to blob and create object URL
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching image:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchImage();
    
    // Cleanup object URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, []);

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
