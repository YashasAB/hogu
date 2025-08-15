import React, { useState } from "react";

const ImageDisplay = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("restaurantId", "cme996hfm000bj4h1cu57rrca");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setImageUrl(result.url || result.imageUrl);
      setMessage("Upload successful!");
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) {
      setMessage("Please enter a download URL");
      return;
    }

    setDownloading(true);
    setMessage("");

    try {
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Create download link
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadUrl.split("/").pop() || "downloaded-image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage("Download successful!");
    } catch (error) {
      console.error("Download error:", error);
      setMessage(
        `Download failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Image Upload & Download Test
      </h2>

      {/* Upload Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Upload Image</h3>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {imageUrl && (
          <div className="space-y-2">
            <p className="text-sm text-green-600">Uploaded successfully!</p>
            <p className="text-sm text-gray-600 break-all">URL: {imageUrl}</p>
            <img
              src={imageUrl}
              alt="Uploaded"
              className="max-w-full h-48 object-cover border rounded"
              onError={(e) => {
                console.error("Image load error:", e);
                setMessage("Failed to load uploaded image");
              }}
            />
          </div>
        )}
      </div>

      {/* Download Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Download Image</h3>
        <div className="space-y-2">
          <input
            type="url"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            placeholder="Enter image URL to download"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleDownload}
            disabled={!downloadUrl || downloading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>

      {/* Test URLs Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold">Quick Test URLs</h3>
        <div className="space-y-2 text-sm">
          <button
            onClick={() =>
              setDownloadUrl(
                "/api/images/storage/cme996hfm000bj4h1cu57rrca/heroImage.jpg",
              )
            }
            className="block w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Test existing hero image
          </button>
          <button
            onClick={() => setDownloadUrl("https://picsum.photos/400/300")}
            className="block w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Test external image (picsum)
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-3 rounded-lg ${
            message.includes("successful")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Debug Info */}
      <div className="border rounded-lg p-4 space-y-2 bg-gray-50">
        <h3 className="text-lg font-semibold">Debug Info</h3>
        <div className="text-sm space-y-1">
          <p>
            <strong>Selected file:</strong>{" "}
            {file ? `${file.name} (${file.size} bytes)` : "None"}
          </p>
          <p>
            <strong>Upload URL:</strong> /api/upload
          </p>
          <p>
            <strong>Storage endpoint:</strong> /api/images/storage/*
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageDisplay;
