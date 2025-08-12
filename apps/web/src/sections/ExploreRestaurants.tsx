
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

export default function ExploreRestaurants() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map once on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      try {
        console.log('Initializing map...');
        
        const map = L.map(mapRef.current!, {
          center: [12.9716, 77.5946],
          zoom: 13,
          scrollWheelZoom: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
        console.log('Map instance created');

        const darkTiles = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 20,
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
          },
        );
        
        darkTiles.addTo(map);
        console.log('Tiles added to map');

        setTimeout(() => {
          map.invalidateSize();
          console.log('Map size invalidated');
          setMapReady(true); // Signal that map is ready
        }, 100);

      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    const timeoutId = setTimeout(initMap, 100);

    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Fetch restaurants once when map is ready
  useEffect(() => {
    if (!mapReady) return;

    const fetchRestaurants = async () => {
      try {
        console.log('Fetching restaurants...');
        const response = await fetch('/api/restaurants');
        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Restaurants data:', data);
          setRestaurants(data);
        } else {
          console.error('Failed to fetch restaurants:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [mapReady]); // Only depends on mapReady flag

  // Update markers when restaurants or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || restaurants.length === 0) {
      console.log('Skipping markers - map not ready or no restaurants');
      return;
    }

    console.log('Adding markers to map, restaurants count:', restaurants.length);

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Create emoji marker function
    const createEmojiMarker = (restaurant: Restaurant) => {
      try {
        console.log('Creating marker for:', restaurant.name, 'at position:', restaurant.position);
        
        const html = `
          <div class="pin ${restaurant.hot ? "pin--hot" : ""}">
            <span class="pin__emoji">${restaurant.emoji}</span>
          </div>
        `;
        const icon = L.divIcon({
          className: "",
          html,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -14],
        });
        
        const marker = L.marker([restaurant.position.lat, restaurant.position.lng], { icon });
        console.log('Marker created successfully for:', restaurant.name);
        return marker;
      } catch (error) {
        console.error('Error creating marker for:', restaurant.name, error);
        return L.marker([restaurant.position.lat, restaurant.position.lng]);
      }
    };

    // Filter restaurants
    const filteredRestaurants = restaurants.filter((restaurant) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "hot") return restaurant.hot;
      return restaurant.category === selectedFilter;
    });

    console.log('Filtered restaurants count:', filteredRestaurants.length);

    // Add markers
    filteredRestaurants.forEach((restaurant, index) => {
      try {
        console.log(`Adding marker ${index + 1}/${filteredRestaurants.length} for:`, restaurant.name, restaurant.position);
        const marker = createEmojiMarker(restaurant);
        
        marker.bindPopup(`
          <div style="text-align: center; font-family: ui-sans-serif, system-ui, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${restaurant.name}</h3>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">${restaurant.neighborhood}</p>
            <a href="/r/${restaurant.slug}" style="display: inline-block; background: #e11d48; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Reserve Now</a>
          </div>
        `);
        
        marker.addTo(mapInstanceRef.current!);
        markersRef.current.push(marker);
        console.log(`Marker ${index + 1} added successfully for:`, restaurant.name);
      } catch (error) {
        console.error('Failed to add marker for:', restaurant.name, error);
      }
    });
    
    console.log('Total markers added:', markersRef.current.length);

    // Fit bounds to visible markers
    if (filteredRestaurants.length > 0) {
      const latlngs = filteredRestaurants.map(
        (r) => [r.position.lat, r.position.lng] as [number, number],
      );
      mapInstanceRef.current!.fitBounds(latlngs, { padding: [28, 28] });
    }
  }, [selectedFilter, restaurants, mapReady]); // Clean dependencies

  const filteredRestaurants = restaurants.filter((restaurant) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "hot") return restaurant.hot;
    return restaurant.category === selectedFilter;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-10">
          <div className="text-xl">Loading restaurants...</div>
        </div>
      </div>
    );
  }

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
                Find Spots Tonight{" "}
                <span className="opacity-60 font-semibold">• Live Map</span>
              </h2>
            </div>
            <p className="text-slate-400 text-sm">
              Scroll to zoom, drag to pan.
            </p>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                {
                  key: "all",
                  label: "✨ All",
                  active: selectedFilter === "all",
                },
                {
                  key: "cocktails",
                  label: "🍸 Cocktails",
                  active: selectedFilter === "cocktails",
                },
                {
                  key: "dinner",
                  label: "🍽️ Dine",
                  active: selectedFilter === "dinner",
                },
                {
                  key: "hot",
                  label: "🔥 Hot Spots",
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
              className="h-[70vh] w-full rounded-2xl border border-slate-400/12 shadow-2xl shadow-violet-600/8 overflow-hidden"
              style={{ minHeight: '500px' }}
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
