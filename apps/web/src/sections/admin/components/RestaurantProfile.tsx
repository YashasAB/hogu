
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
      // Set preview to show the uploaded image
      setPhotoPreview(result.imageUrl);
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
          
          {/* Current/Preview Image */}
          {(photoPreview || profileData.heroImageUrl) && (
            <div className="mb-4">
              <div className="relative">
                <img
                  src={photoPreview || profileData.heroImageUrl}
                  alt="Restaurant hero"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-slate-600 block"
                  style={{ 
                    display: 'block', 
                    maxWidth: '100%', 
                    height: '192px',
                    backgroundColor: '#f3f4f6',
                    minHeight: '192px',
                    width: '100%'
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', e.currentTarget.src);
                    console.error('Photo preview:', photoPreview);
                    console.error('Profile data heroImageUrl:', profileData.heroImageUrl);
                    console.error('Image element dimensions:', {
                      width: e.currentTarget.width,
                      height: e.currentTarget.height,
                      naturalWidth: e.currentTarget.naturalWidth,
                      naturalHeight: e.currentTarget.naturalHeight,
                      complete: e.currentTarget.complete
                    });
                    
                    // Show error state
                    e.currentTarget.style.display = 'none';
                    const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                    if (errorDiv && errorDiv.classList.contains('error-placeholder')) {
                      errorDiv.style.display = 'flex';
                    }
                  }}
                  onLoad={(e) => {
                    console.log('=== ADMIN IMAGE LOADED ===');
                    console.log('Image URL:', photoPreview || profileData.heroImageUrl);
                    console.log('Image dimensions:', {
                      width: e.currentTarget.width,
                      height: e.currentTarget.height,
                      naturalWidth: e.currentTarget.naturalWidth,
                      naturalHeight: e.currentTarget.naturalHeight
                    });
                    console.log('Image element:', e.currentTarget);
                    console.log('Image visibility:', window.getComputedStyle(e.currentTarget).visibility);
                    console.log('Image opacity:', window.getComputedStyle(e.currentTarget).opacity);
                    console.log('==========================');
                    
                    // Hide error state if shown
                    const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                    if (errorDiv && errorDiv.classList.contains('error-placeholder')) {
                      errorDiv.style.display = 'none';
                    }
                  }}
                />
                <div 
                  className="error-placeholder w-full max-w-md h-48 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center text-slate-400"
                  style={{ display: 'none' }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-sm">Image failed to load</div>
                  </div>
                </div>
              </div>
              {photoPreview && (
                <p className="text-sm text-green-400 mt-2">
                  {photoPreview.startsWith('https://') ? '✓ Image uploaded successfully - click Save to confirm' : 'Preview - click Save to confirm'}
                </p>
              )}
              <div className="mt-2 text-xs text-slate-400 break-all">
                Current URL: {photoPreview || profileData.heroImageUrl}
              </div>
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
