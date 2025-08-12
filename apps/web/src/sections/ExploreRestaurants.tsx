import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "ZLB 23 (at The Leela Palace)",
    slug: "zlb",
    emoji: "🍸",
    position: { lat: 12.960695, lng: 77.648663 },
    image: "/api/placeholder/200/150",
    neighborhood: "Old Airport Rd",
    category: "cocktails",
    hot: true,
  },
  {
    id: "2",
    name: "Soka",
    slug: "soka",
    emoji: "🍸",
    position: { lat: 12.965215, lng: 77.638143 },
    image: "/api/placeholder/200/150",
    neighborhood: "Koramangala",
    category: "cocktails",
    hot: false,
  },
  {
    id: "3",
    name: "Bar Spirit Forward",
    slug: "spirit-forward",
    emoji: "🥃",
    position: { lat: 12.975125, lng: 77.602350 },
    image: "/api/placeholder/200/150",
    neighborhood: "CBD",
    category: "cocktails",
    hot: true,
  },
  {
    id: "4",
    name: "Naru Noodle Bar",
    slug: "naru",
    emoji: "🍱",
    position: { lat: 12.958431, lng: 77.592895 },
    image: "/api/placeholder/200/150",
    neighborhood: "CBD",
    category: "dinner",
    hot: false,
  },

  {
    id: "8",
    name: "Pizza 4P's (Indiranagar)",
    slug: "pizza-4ps",
    emoji: "🍕",
    position: { lat: 12.969968, lng: 77.636089 },
    image: "/api/placeholder/200/150",
    neighborhood: "Indiranagar",
    category: "dinner",
    hot: false,
  },
  {
    id: "9",
    name: "Dali & Gala",
    slug: "dali-and-gala",
    emoji: "🍸",
    position: { lat: 12.975124, lng: 77.602868 },
    image: "/api/placeholder/200/150",
    neighborhood: "CBD",
    category: "cocktails",
    hot: false,
  },
];

export default function ExploreRestaurants() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 13,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Add dark tile layer (matching the neon theme)
    const darkTiles = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      },
    );
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
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -14],
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
      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    });

    // Fit bounds to visible markers
    if (filteredRestaurants.length > 0) {
      const latlngs = filteredRestaurants.map(
        (r) => [r.position.lat, r.position.lng] as [number, number],
      );
      mapInstanceRef.current.fitBounds(latlngs, { padding: [28, 28] });
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
