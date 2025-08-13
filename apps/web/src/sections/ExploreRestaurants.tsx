import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MAP_CONFIG, TILE_CONFIG, MAP_STYLES, MAP_TEXT, CATEGORY_EMOJIS } from "../constants/mapConfig";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  position: { lat: number; lng: number };
  image: string;
  neighborhood: string;
  category: string;
  hot?: boolean;
};



// Helper function to get emoji for category
const getCategoryEmoji = (category: string) => {
  return CATEGORY_EMOJIS[category.toLowerCase()] || CATEGORY_EMOJIS.default;
};

export default function ExploreRestaurants() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);

  const markersRef = useRef<L.Marker[]>([]);

  // Fetch restaurants from API
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching restaurants from API...');
        const response = await fetch('/api/restaurants');

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API response:', data);

        if (Array.isArray(data) && data.length > 0) {
          setRestaurants(data);

          // Extract unique categories and neighborhoods from the data
          const categories = [...new Set(data.map(r => r.category).filter(Boolean))];
          const neighborhoods = [...new Set(data.map(r => r.neighborhood).filter(Boolean))];

          setAvailableCategories(categories);
          setAvailableNeighborhoods(neighborhoods);
          console.log('Successfully loaded restaurants from API');
          console.log('Available categories:', categories);
          console.log('Available neighborhoods:', neighborhoods);
        } else {
          console.log('API returned empty data');
          setRestaurants([]);
          setAvailableCategories([]);
          setAvailableNeighborhoods([]);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setError('Failed to load restaurants from API');
        setRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [MAP_CONFIG.center.lat, MAP_CONFIG.center.lng],
      zoom: MAP_CONFIG.zoom,
      scrollWheelZoom: MAP_CONFIG.scrollWheelZoom,
      zoomControl: MAP_CONFIG.zoomControl,
    });

    mapInstanceRef.current = map;

    // Add dark tile layer (matching the neon theme)
    const darkTiles = L.tileLayer(TILE_CONFIG.url, {
      maxZoom: MAP_CONFIG.maxZoom,
      attribution: TILE_CONFIG.attribution,
    });
    darkTiles.addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when filter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Create emoji marker function
    const createEmojiMarker = (restaurant: Restaurant) => {
      const html = `
        <div class="pin ${restaurant.hot ? "pin--hot" : ""}">
          <span class="pin__emoji">${restaurant.emoji}</span>
        </div>
      `;
      const icon = L.divIcon({
        className: "",
        html,
        iconSize: MAP_STYLES.markerSize,
        iconAnchor: MAP_STYLES.markerAnchor,
        popupAnchor: MAP_STYLES.popupAnchor,
      });
      return L.marker([restaurant.position.lat, restaurant.position.lng], {
        icon,
      });
    };

    // Add filtered restaurant markers
    const filteredRestaurants = restaurants.filter((restaurant) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "hot") return restaurant.hot;
      return restaurant.category === selectedFilter;
    });

    filteredRestaurants.forEach((restaurant) => {
      const marker = createEmojiMarker(restaurant);
      marker.bindPopup(`
        <div style="text-align: center; font-family: ui-sans-serif, system-ui, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${restaurant.name}</h3>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">${restaurant.neighborhood}</p>
          <a href="/r/${restaurant.slug}" style="display: inline-block; background: #e11d48; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reserve Now</a>
        </div>
      `);
      if (mapInstanceRef.current) {
        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to visible markers
    if (filteredRestaurants.length > 0 && mapInstanceRef.current) {
      const latlngs = filteredRestaurants.map(
        (r) => [r.position.lat, r.position.lng] as [number, number],
      );
      const map = mapInstanceRef.current;
      if (map) {
        map.fitBounds(latlngs, { padding: MAP_STYLES.boundsOptions.padding });
      }
    }
  }, [selectedFilter]);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "hot") return restaurant.hot;
    return restaurant.category === selectedFilter;
  });

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
        <div className="relative z-10 px-5 py-8 sm:px-8">
          <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 shadow-lg shadow-violet-400/30"></div>
            <span>Explore Tonight in Bengaluru</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight mb-2">
            Find Tables on the Map
          </h1>
          <p className="opacity-90 max-w-2xl">
            Discover available tables at the city's hottest spots. Tap on the
            markers to see what's available right now. Zoom and pan to explore
            different areas.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/" className="btn bg-white text-brand">
              ← Back to Home
            </Link>
            <a href="#map" className="btn btn-accent">
              View Map
            </a>
          </div>
        </div>
      </section>

      {/* Neon Map Section */}
      <section id="map" className="max-w-5xl mx-auto">
        <div className="bg-slate-900/80 border border-slate-400/12 rounded-3xl shadow-2xl backdrop-blur-sm overflow-hidden">
          {/* Map Header */}
          <div className="relative p-5 bg-gradient-to-r from-violet-600/30 via-transparent to-cyan-500/20">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 shadow-lg shadow-violet-400/30"></div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {MAP_TEXT.sectionTitle}{" "}
                <span className="opacity-60 font-semibold">• {MAP_TEXT.sectionSubtitle}</span>
              </h2>
            </div>
            <p className="text-slate-400 text-sm">
              {MAP_TEXT.mapDescription} {isLoading ? MAP_TEXT.loadingText : `${MAP_TEXT.showingText} ${restaurants.length} ${MAP_TEXT.restaurantsText}`}
              {error && <span className="text-amber-400"> • {error}</span>}
            </p>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                {
                  key: "all",
                  label: MAP_TEXT.allFilterLabel,
                  active: selectedFilter === "all",
                },
                ...availableCategories.map(category => ({
                  key: category,
                  label: `${getCategoryEmoji(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                  active: selectedFilter === category,
                })),
                {
                  key: "hot",
                  label: MAP_TEXT.hotFilterLabel,
                  active: selectedFilter === "hot",
                },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                    filter.active
                      ? "bg-gradient-to-r from-violet-500/25 to-cyan-500/25 text-white border border-violet-400/30"
                      : "bg-slate-800/60 text-slate-300 border border-slate-600/20 hover:bg-slate-700/60"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map Container */}
          <div className="p-4">
            <div
              ref={mapRef}
              className="w-full rounded-2xl border border-slate-400/12 shadow-2xl shadow-violet-600/8 overflow-hidden"
              style={{ height: MAP_STYLES.mapHeight, minHeight: MAP_STYLES.minHeight }}
            />
            <div className="text-xs text-slate-400 mt-2 opacity-85">
              Tiles ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200"
              >
                OpenStreetMap
              </a>{" "}
              contributors • Dark tiles ©{" "}
              <a
                href="https://carto.com/"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200"
              >
                CARTO
              </a>{" "}
              • Built with{" "}
              <a
                href="https://leafletjs.com/"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200"
              >
                Leaflet
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant List - Mobile Fallback */}
      <section className="lg:hidden space-y-4">
        <div className="relative overflow-hidden rounded-2xl text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
          <div className="relative z-10 px-5 py-6 sm:px-8">
            <h2 className="text-xl font-semibold">Available Tonight</h2>
            <p className="opacity-90 text-sm">
              Browse restaurants on smaller screens
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredRestaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/r/${restaurant.slug}`}
              className="card hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center">
                  {restaurant.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-brand mb-1">
                    {restaurant.name}
                  </div>
                  <div className="text-muted">{restaurant.neighborhood}</div>
                </div>
                <div className="btn btn-primary">Reserve</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-6 py-6">
        <p className="font-semibold mb-2">
          Real-time availability. No bots. Fair access.
        </p>
        <p className="text-sm">
          Hogu verifies identities and uses queue fairness to keep things clean.
          Your booking is yours — not a scalper's.
        </p>
      </section>
    </div>
  );
}