
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

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
  instagramUrl?: string | null;
  heroImageUrl?: string | null;
  website?: string | null;
  cuisineTags?: string[];
};

type TimeSlot = {
  id: string;
  time: string;
  available: boolean;
};

// Local restaurant data (matching ExploreRestaurants)
const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "ZLB 23 (at The Leela Palace)",
    slug: "zlb",
    emoji: "🍸",
    position: { lat: 12.960695, lng: 77.648663 },
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
    neighborhood: "Old Airport Road",
    category: "cocktails",
    hot: true,
    instagramUrl: "https://instagram.com/zlb23",
    website: "https://theleela.com",
    cuisineTags: ["Cocktails", "Fine Dining", "Rooftop"],
  },
  {
    id: "2",
    name: "Soka",
    slug: "soka",
    emoji: "🍸",
    position: { lat: 12.965215, lng: 77.638143 },
    image:
      "https://images.unsplash.com/photo-1528605105345-5344ea20e269?q=80&w=1600&auto=format&fit=crop",
    neighborhood: "Koramangala",
    category: "cocktails",
    hot: false,
    instagramUrl: "https://instagram.com/soka",
    cuisineTags: ["Cocktails", "Asian Fusion"],
  },
  {
    id: "3",
    name: "Bar Spirit Forward",
    slug: "spirit-forward",
    emoji: "🥃",
    position: { lat: 12.975125, lng: 77.60287 },
    image: "/spirit-forward-image.jpg",
    neighborhood: "CBD",
    category: "cocktails",
    hot: true,
    instagramUrl: "https://instagram.com/spiritforward",
    cuisineTags: ["Cocktails", "Whiskey", "Bar"],
  },
  {
    id: "4",
    name: "Naru Noodle Bar",
    slug: "naru",
    emoji: "🍱",
    position: { lat: 12.958431, lng: 77.592895 },
    image:
      "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1600&auto=format&fit=crop",
    neighborhood: "CBD",
    category: "dinner",
    hot: false,
    instagramUrl: "https://instagram.com/naru",
    cuisineTags: ["Japanese", "Noodles", "Asian"],
  },
  {
    id: "8",
    name: "Pizza 4P's (Indiranagar)",
    slug: "pizza-4ps",
    emoji: "🍕",
    position: { lat: 12.969968, lng: 77.636089 },
    image:
      "https://images.unsplash.com/photo-1541745537413-b804d1a57a51?q=80&w=1600&auto=format&fit=crop",
    neighborhood: "Indiranagar",
    category: "pizza",
    hot: false,
    instagramUrl: "https://instagram.com/pizza4ps",
    cuisineTags: ["Pizza", "Italian", "Cheese"],
  },
  {
    id: "9",
    name: "Dali & Gala",
    slug: "dali-and-gala",
    emoji: "🍸",
    position: { lat: 12.975125, lng: 77.60287 },
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop",
    neighborhood: "CBD",
    category: "cocktails",
    hot: false,
    instagramUrl: "https://instagram.com/daligala",
    cuisineTags: ["Cocktails", "Art", "Modern"],
  },
];

// Generate demo time slots
const generateTimeSlots = (): TimeSlot[] => {
  const times = [
    "6:00 PM",
    "6:30 PM",
    "7:00 PM",
    "7:30 PM",
    "8:00 PM",
    "8:30 PM",
    "9:00 PM",
    "9:30 PM",
    "10:00 PM",
  ];
  return times.map((t, i) => ({
    id: `slot-${i}`,
    time: t,
    available: Math.random() > 0.3,
  }));
};

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-amber-500 shadow-sm border border-white/10">
    {children}
  </span>
);

const Chip: React.FC<{ active?: boolean; children: React.ReactNode }> = ({
  active,
  children,
}) => (
  <span
    className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
      active
        ? "text-white bg-gradient-to-r from-rose-700 to-amber-600 border-transparent shadow"
        : "text-slate-200 bg-slate-800 border-slate-600 hover:border-rose-500/40"
    }`}
  >
    {children}
  </span>
);

const Row: React.FC<{
  label: string;
  last?: boolean;
  children: React.ReactNode;
}> = ({ label, last, children }) => (
  <div
    className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-white/10"}`}
  >
    <span className="text-slate-300">{label}</span>
    <span className="text-slate-400">{children}</span>
  </div>
);

export default function RestaurantDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/restaurants/${slug}`);
        
        if (response.ok) {
          const data = await response.json();
          setRestaurant(data);
        } else {
          // Fallback to hardcoded data if API fails
          const fallbackRestaurant = restaurants.find((r) => r.slug === slug);
          setRestaurant(fallbackRestaurant || restaurants[0]);
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error);
        // Fallback to hardcoded data on error
        const fallbackRestaurant = restaurants.find((r) => r.slug === slug);
        setRestaurant(fallbackRestaurant || restaurants[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [slug]);

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [partySize, setPartySize] = useState(2);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(generateTimeSlots());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const bookingRef = useRef<HTMLDivElement | null>(null);

  // Fetch availability when date, party size, or restaurant changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!restaurant || !date || !partySize) return;
      
      try {
        const response = await fetch(`/api/restaurants/${restaurant.slug}/availability?date=${date}&partySize=${partySize}`);
        if (response.ok) {
          const data = await response.json();
          setTimeSlots(data);
        } else {
          // Fallback to generated time slots
          setTimeSlots(generateTimeSlots());
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
        // Fallback to generated time slots
        setTimeSlots(generateTimeSlots());
      }
      setSelectedSlot(null);
    };

    fetchAvailability();
  }, [restaurant, date, partySize]);

  const handleReserveNow = async () => {
    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    const token = localStorage.getItem('hogu_token');
    if (!token) {
      alert("Please log in to make a reservation");
      navigate('/login');
      return;
    }

    const slot = timeSlots.find((s) => s.id === selectedSlot);
    if (!slot) return;

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantSlug: restaurant?.slug,
          date: date,
          time: slot.time,
          partySize: partySize
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create reservation');
        return;
      }

      alert(
        `Reservation created! Status: ${data.status}\n${restaurant?.name} on ${date} at ${slot?.time} for ${partySize} ${partySize === 1 ? "person" : "people"}`
      );
      
      // Reset selection and navigate to home
      setSelectedSlot(null);
      navigate('/');
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Failed to create reservation. Please try again.');
    }
  };

  const handleMobileCTA = () => {
    if (selectedSlot) {
      handleReserveNow();
    } else {
      bookingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Restaurant not found</h1>
          <p className="text-slate-400">
            The restaurant you're looking for doesn't exist.
          </p>
          <Link to="/explore-tonight" className="btn btn-primary">
            ← Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-slate-950 text-slate-100 pb-28 md:pb-0"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,.18)]" />
          <div className="text-sm opacity-80">Explore · Bengaluru</div>
          <div className="ml-auto">
            <Link
              to="/explore-tonight"
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-sm font-medium hover:bg-slate-800/80"
            >
              ← Back to Map
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-xl">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-[38vh] sm:h-[42vh] md:h-[56vh] object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <div className="flex items-end justify-between gap-3 md:gap-4">
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <span className="text-2xl drop-shadow">
                    {restaurant.emoji}
                  </span>
                  {restaurant.hot && <Badge>🔥 HOT</Badge>}
                  <Chip active>{restaurant.neighborhood}</Chip>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                  {restaurant.name}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  {restaurant.cuisineTags?.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex gap-2">
                {restaurant.instagramUrl && (
                  <a
                    href={restaurant.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium"
                  >
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>📸</span>
                      <span>Instagram</span>
                    </span>
                  </a>
                )}
                {restaurant.website && (
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* About / details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <section className="rounded-2xl p-4 sm:p-5 ring-1 ring-white/10 bg-slate-900/70">
              <h2 className="text-lg sm:text-xl font-semibold mb-3">About</h2>
              <div className="divide-y divide-white/10">
                <Row label="Neighborhood">{restaurant.neighborhood}</Row>
                <Row label="Category" last>
                  <span className="capitalize">{restaurant.category}</span>
                </Row>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {restaurant.instagramUrl && (
                  <a
                    href={restaurant.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm font-medium hover:bg-slate-800/80"
                  >
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden>📸</span>
                      <span>Instagram</span>
                    </span>
                  </a>
                )}
                {restaurant.website && (
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm font-medium hover:bg-slate-800/80"
                  >
                    Website
                  </a>
                )}
                <a
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 text-sm font-semibold shadow hover:opacity-95"
                  href={`https://www.openstreetmap.org/?mlat=${restaurant.position.lat}&mlon=${restaurant.position.lng}#map=17/${restaurant.position.lat}/${restaurant.position.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on map
                </a>
              </div>
            </section>

            <section className="rounded-2xl p-4 sm:p-5 ring-1 ring-white/10 bg-slate-900/70">
              <h2 className="text-lg sm:text-xl font-semibold mb-3">
                Coordinates
              </h2>
              <div className="text-sm opacity-80">
                {restaurant.position.lat.toFixed(6)},{" "}
                {restaurant.position.lng.toFixed(6)}
              </div>
            </section>
          </div>

          {/* Booking card */}
          <aside className="lg:col-span-1" ref={bookingRef}>
            <div className="rounded-2xl p-4 sm:p-5 ring-1 ring-white/10 bg-slate-900/80 shadow-xl lg:sticky lg:top-20">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h2 className="text-base sm:text-lg font-semibold">
                  Make a reservation
                </h2>
              </div>

              <label className="block text-sm mb-1">Date</label>
              <input
                type="date"
                className="w-full mb-3 px-3 py-2 h-12 rounded-xl bg-slate-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
              />

              <label className="block text-sm mb-1">Party size</label>
              <select
                className="w-full mb-4 px-3 py-2 h-12 rounded-xl bg-slate-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>

              <h3 className="text-sm font-medium mb-2">Available times</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {timeSlots.map((slot) => {
                  const selected = selectedSlot === slot.id;
                  const base =
                    "px-3 h-12 rounded-xl text-sm font-semibold border transition";
                  return (
                    <button
                      key={slot.id}
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedSlot(slot.id)}
                      className={[
                        base,
                        selected &&
                          "bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 border-transparent",
                        !selected &&
                          slot.available &&
                          "bg-slate-800 border-white/10 hover:border-rose-500/30",
                        !slot.available &&
                          "bg-slate-800/40 border-white/5 text-slate-500 cursor-not-allowed",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>

              {/* Desktop/Tablet CTA (mobile has bottom bar) */}
              <div className="hidden md:block">
                <button
                  onClick={handleReserveNow}
                  disabled={!selectedSlot}
                  className={`w-full py-3 rounded-2xl font-bold shadow-lg transition ${
                    selectedSlot
                      ? "bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 hover:opacity-95"
                      : "bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5"
                  }`}
                >
                  {selectedSlot ? "Reserve now" : "Select a time slot"}
                </button>
                <p className="mt-3 text-xs opacity-70">
                  You won't be charged yet. Confirmation depends on restaurant
                  availability.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar CTA */}
      <div
        className="fixed inset-x-0 bottom-0 md:hidden bg-slate-950/85 backdrop-blur border-t border-white/10 p-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
      >
        <button
          onClick={handleMobileCTA}
          className={`w-full h-12 rounded-2xl font-bold shadow-lg transition ${
            selectedSlot
              ? "bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 hover:opacity-95"
              : "bg-slate-800/60 text-slate-300 border border-white/5"
          }`}
        >
          {selectedSlot ? "Reserve now" : "Select a time slot"}
        </button>
      </div>
    </div>
  );
}
