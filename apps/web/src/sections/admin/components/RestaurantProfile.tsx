
import React from 'react';

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
            Hero Image URL
          </label>
          <input
            type="url"
            value={profileData.heroImageUrl}
            onChange={(e) => onDataChange({ heroImageUrl: e.target.value })}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="https://example.com/hero-image.jpg"
          />
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
