import React, { useState } from "react";

type Restaurant = {
  id: string;
  name: string;
  neighborhood: string;
  instagramUrl?: string;
  website?: string;
  heroImageUrl?: string;
};

interface RestaurantProfileProps {
  restaurant: Restaurant;
  profileData: {
    name: string;
    neighborhood: string;
    instagramUrl: string;
    website: string;
    heroImageUrl: string;
  };
  loading: boolean;
  onDataChange: (data: Partial<RestaurantProfileProps["profileData"]>) => void;
  onSave: () => void;
}

export const RestaurantProfile: React.FC<RestaurantProfileProps> = ({
  restaurant,
  profileData,
  loading,
  onDataChange,
  onSave,
}) => {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("restaurantId", restaurantId);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      onDataChange({ heroImageUrl: result.url || result.imageUrl });
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert(
        `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setUploadingPhoto(false);
    }
  };
  return (
    <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70">
      <h2 className="text-lg sm:text-xl font-semibold mb-6">
        Restaurant Profile
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Restaurant Name
          </label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => onDataChange({ name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Enter restaurant name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Neighborhood
          </label>
          <input
            type="text"
            value={profileData.neighborhood}
            onChange={(e) => onDataChange({ neighborhood: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Enter neighborhood"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Instagram URL
          </label>
          <input
            type="url"
            value={profileData.instagramUrl}
            onChange={(e) => onDataChange({ instagramUrl: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="https://instagram.com/yourrestaurant"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={profileData.website}
            onChange={(e) => onDataChange({ website: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="https://yourrestaurant.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Hero Image
          </label>

          {/* Current/Preview Image */}
          <div className="mb-4">
            <div className="relative bg-slate-800 rounded-lg border border-slate-600 p-2">
              {profileData.heroImageUrl ? (
                <>
                  <div className="text-xs text-yellow-400 mb-2">
                    Image URL: {profileData.heroImageUrl}
                  </div>
                  <img
                    src={profileData.heroImageUrl}
                    alt="Current hero image"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600"
                    onLoad={(e) => {
                      console.log(
                        "✅ Profile image loaded successfully:",
                        e.currentTarget.src,
                      );
                      console.log("Image dimensions:", {
                        width: e.currentTarget.width,
                        height: e.currentTarget.height,
                        naturalWidth: e.currentTarget.naturalWidth,
                        naturalHeight: e.currentTarget.naturalHeight,
                      });
                    }}
                    onError={(e) => {
                      console.error(
                        "❌ Profile image failed to load:",
                        e.currentTarget.src,
                      );
                      // Hide the broken image and show placeholder
                      e.currentTarget.style.display = "none";
                      const placeholder =
                        e.currentTarget.parentElement?.querySelector(
                          ".placeholder-div",
                        ) as HTMLElement;
                      if (placeholder) placeholder.style.display = "flex";
                    }}
                  />
                  <div
                    className="placeholder-div w-full max-w-md h-48 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center text-slate-400"
                    style={{ display: "none" }}
                  >
                    <div className="text-center">
                      <svg
                        className="w-12 h-12 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm">Image failed to load</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full max-w-md h-48 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm">No image uploaded</p>
                  </div>
                </div>
              )}
            </div>
            {profileData.heroImageUrl && (
              <p className="text-sm text-green-400 mt-2">
                ✅ Current hero image
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
              className="block w-full text-sm text-slate-300
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0
                         file:text-sm file:font-medium
                         file:bg-rose-600 file:text-white
                         hover:file:bg-rose-700
                         file:disabled:opacity-50 file:disabled:cursor-not-allowed"
            />
            {uploadingPhoto && (
              <p className="text-sm text-slate-400 mt-2">Uploading photo...</p>
            )}
            {profileData.heroImageUrl && (
              <p className="text-sm text-green-400 mt-2">
                ✓ Hero image is set. The image will appear on the restaurant
                detail page.
              </p>
            )}
          </div>

          {/* Manual URL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Or enter image URL manually:
            </label>
            <input
              type="url"
              value={profileData.heroImageUrl}
              onChange={(e) => onDataChange({ heroImageUrl: e.target.value })}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="https://example.com/hero-image.jpg"
            />
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={loading}
          className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </section>
  );
};
