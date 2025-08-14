
import React, { useState } from 'react';

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
  onDataChange: (data: Partial<RestaurantProfileProps['profileData']>) => void;
  onSave: () => void;
}

export const RestaurantProfile: React.FC<RestaurantProfileProps> = ({
  restaurant,
  profileData,
  loading,
  onDataChange,
  onSave
}) => {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('heroImage', file);

      const token = localStorage.getItem('hogu_restaurant_token');
      const response = await fetch('/api/admin/restaurant/hero-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      const result = await response.json();
      onDataChange({ heroImageUrl: result.imageUrl });
      setPhotoPreview(null); // Clear preview so current image shows
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };
  return (
    <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70">
      <h2 className="text-lg sm:text-xl font-semibold mb-6">Restaurant Profile</h2>

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
          
          {/* DEBUG SECTION - Remove this after testing */}
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded">
            <h4 className="text-red-400 font-bold mb-2">DEBUG INFO:</h4>
            <p className="text-sm text-white mb-1">
              <strong>photoPreview:</strong> {photoPreview || 'null'}
            </p>
            <p className="text-sm text-white mb-1">
              <strong>profileData.heroImageUrl:</strong> {profileData.heroImageUrl || 'null'}
            </p>
            <p className="text-sm text-white mb-1">
              <strong>Final src value:</strong> {photoPreview || profileData.heroImageUrl || 'null'}
            </p>
            
            {/* Test with hardcoded working image URL */}
            <div className="mt-2">
              <p className="text-sm text-yellow-400 mb-1">Test with hardcoded URL:</p>
              <img
                src="https://storage.replit.com/a5596f5b-0e64-44d2-9f7e-86e86ceed4ae/cme996hfm000bj4h1cu57rrca/heroImage.jpg"
                alt="Hardcoded test"
                className="w-32 h-24 object-cover rounded border border-yellow-500"
                onLoad={() => console.log('✅ Hardcoded image loaded successfully')}
                onError={(e) => console.log('❌ Hardcoded image failed to load:', e)}
              />
            </div>
          </div>

          {/* Current/Preview Image */}
          {(photoPreview || profileData.heroImageUrl) && (
            <div className="mb-4">
              <div className="relative">
                <img
                  src={photoPreview || profileData.heroImageUrl}
                  alt={photoPreview ? "Preview" : "Current hero image"}
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600"
                  onLoad={(e) => {
                    console.log('✅ Profile image loaded successfully:', e.currentTarget.src);
                  }}
                  onError={(e) => {
                    console.error('❌ Profile image failed to load:', e.currentTarget.src);
                    console.error('Error details:', e);
                  }}
                />
              </div>
              {photoPreview ? (
                <p className="text-sm text-blue-400 mt-2">
                  Preview - click Save to confirm upload
                </p>
              ) : (
                <p className="text-sm text-slate-400 mt-2">
                  Current hero image
                </p>
              )}
            </div>
          )}

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
                ✓ Hero image is set. The image will appear on the restaurant detail page.
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
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </section>
  );
};
