
// Map Configuration Constants
export const MAP_CONFIG = {
  // Default map center (Bengaluru)
  center: {
    lat: 12.9716,
    lng: 77.5946,
  },
  zoom: 13,
  maxZoom: 20,
  scrollWheelZoom: true,
  zoomControl: true,
} as const;

// Tile Layer Configuration
export const TILE_CONFIG = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
} as const;

// Map Styling
export const MAP_STYLES = {
  mapHeight: "70vh",
  minHeight: "500px",
  markerSize: [38, 38] as [number, number],
  markerAnchor: [19, 19] as [number, number],
  popupAnchor: [0, -14] as [number, number],
  boundsOptions: {
    padding: [28, 28] as [number, number],
  },
} as const;

// UI Text Constants
export const MAP_TEXT = {
  sectionTitle: "Find Spots Tonight",
  sectionSubtitle: "Live Map",
  mapDescription: "Scroll to zoom, drag to pan.",
  loadingText: "Loading restaurants...",
  showingText: "Showing",
  restaurantsText: "restaurants",
  allFilterLabel: "✨ All",
  hotFilterLabel: "🔥 Hot Spots",
} as const;

// Category Emoji Mapping
export const CATEGORY_EMOJIS: Record<string, string> = {
  cocktails: "🍸",
  dinner: "🍽️",
  lunch: "🥗",
  breakfast: "🍳",
  coffee: "☕",
  dessert: "🍰",
  pizza: "🍕",
  asian: "🥢",
  italian: "🍝",
  mexican: "🌮",
  indian: "🍛",
  bar: "🍺",
  wine: "🍷",
  default: "🍴",
} as const;
