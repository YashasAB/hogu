
// apps/web/src/sections/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Extend Window interface to include emergencyLogout
declare global {
  interface Window {
    emergencyLogout?: () => void;
  }
}
import DarkDatePicker from "../components/DarkDatePicker";
import TonightNearYou from "../components/TonightNearYou"; // Import the new component
import UserReservations from "../components/UserReservations"; // Import the UserReservations component

// Define types for better type safety
type Slot = { slot_id: string; time: string; party_size: number };
type SlotSummary = {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    neighborhood?: string | null;
    hero_image_url?: string | null;
    emoji?: string | null; // Added emoji for restaurant display
  };
  slots: Slot[];
};
type TonightRes = { now: SlotSummary[]; later: SlotSummary[] };
type WeekDay = { date: string; available_count: number; picks: SlotSummary[] };
type WeekRes = { days: WeekDay[] };
type Reservation = {
  id: string;
  restaurant: { name: string; emoji?: string | null; slug: string };
  slot: { date: string; time: string };
  partySize: number;
  status: string;
};
type User = { name: string; username: string; email: string; id: string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [liveStatus, setLiveStatus] = useState({
    pending: 0,
    ongoing: 0,
    completed: 0,
  });
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("hogu_token");
      if (token) {
        try {
          const response = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem("hogu_token");
            setUser(null);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("hogu_token");
          setUser(null);
        }
      }
    };

    // Set up emergency logout function
    window.emergencyLogout = () => {
      localStorage.removeItem("hogu_token");
      setUser(null);
    };

    checkAuth();
  }, []);

  // Function to fetch reservations
  const fetchReservations = async () => {
    const token = localStorage.getItem("hogu_token");
    if (user && token) {
      setLoadingReservations(true);
      try {
        // Fetch live status
        const statusResponse = await fetch("/api/reservations/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setLiveStatus(status);
        }

        // Fetch user reservations
        const reservationsResponse = await fetch("/api/reservations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reservationsResponse.ok) {
          const reservations = await reservationsResponse.json();
          setUserReservations(reservations);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingReservations(false);
      }
    }
  };

  // Fetch live status and reservations when user is logged in
  useEffect(() => {
    fetchReservations();
  }, [user]); // Depend on user to ensure fetch only happens when user is available

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserDropdown && !target.closest(".relative")) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showUserDropdown]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("hogu_token");
    setUser(null);
    setShowUserDropdown(false);
    window.location.reload(); // Force refresh to reset all state
  };

  // Emergency logout - you can call this from browser console if needed
  window.emergencyLogout = handleLogout;

  // --- state ---
  const [party, setParty] = useState<number | "">(""); // No default value, user must select
  const [selectedDate, setSelectedDate] = useState(""); // State for the selected date
  const [city] = useState("BLR");
  const [tonight, setTonight] = useState<TonightRes>({ now: [], later: [] });
  const [week, setWeek] = useState<WeekRes>({ days: [] });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hogu_token") : null;

  // --- data fetch ---
  useEffect(() => {
    // Only fetch if party and selectedDate are valid
    if (party !== "" && selectedDate) {
      fetch(
        `/api/discover/tonight?city=${city}&party_size=${party}&start_date=${selectedDate}`,
      )
        .then((r) => r.json())
        .then(setTonight)
        .catch(() => {});
      fetch(
        `/api/discover/week?city=${city}&start=${selectedDate}&days=7&party_size=${party}`,
      )
        .then((r) => r.json())
        .then(setWeek)
        .catch(() => {});
    } else {
      // Reset data if selections are invalid
      setTonight({ now: [], later: [] });
      setWeek({ days: [] });
    }
  }, [city, party, selectedDate]); // Depend on selectedDate as well

  const weekToday = week.days.find((day) => day.date === selectedDate);
  const todayLabel = useMemo(
    () =>
      selectedDate
        ? new Date(selectedDate).toLocaleDateString(undefined, {
            weekday: "long",
          })
        : "Select a Date",
    [selectedDate],
  );

  // --- UI ---
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-semibold">{children}</h2>
  );

  const Spark = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className="inline-block align-[-2px]"
    >
      <path
        d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z"
        fill="currentColor"
      />
    </svg>
  );

  // --- UI ---
  return (
    <div className="space-y-8 mx-4 sm:mx-6 lg:mx-8">
      {/* USER GREETING WITH DROPDOWN */}
      {user && (
        <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Hello {user.name}!
                </h2>
                <p className="text-gray-600">
                  Welcome back to Hogu. Ready to discover tonight's hottest
                  spots?
                </p>
              </div>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserDropdown(!showUserDropdown);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  {user.username}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showUserDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <Link
                      to="/me"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      My Profile
                    </Link>
                    <Link
                      to="/me"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      My Reservations
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* USER RESERVATIONS SECTION */}
      {user && (
        <UserReservations
          user={user}
          userReservations={userReservations}
          loadingReservations={loadingReservations}
          onReservationsUpdate={fetchReservations}
        />
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-2xl text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/api/placeholder/800/400')] bg-cover bg-center opacity-30"></div>
        <div className="relative z-10 p-8 sm:p-12 lg:p-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="inline-block">
              Discover Bengaluru's
              <br />
              Hottest Tables <Spark />
            </span>
          </h1>
          <p className="text-xl sm:text-2xl mb-8 max-w-2xl opacity-90">
            Beat the crowds. Book prime-time slots at the city's most coveted
            restaurants through our exclusive drop system.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors text-center"
              >
                Join Hogu
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FILTERS SECTION */}
      <section className="relative z-1 mt-8 rounded-2xl bg-slate-900 text-white p-6 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Find Your Perfect Table
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Party Size Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Party Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((size) => (
                  <button
                    key={size}
                    onClick={() => setParty(size)}
                    className={`p-3 rounded-lg border text-center font-medium transition-all ${
                      party === size
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    {size === 4 ? "4+" : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                Select Date
              </label>
              <DarkDatePicker
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                today={today}
              />
            </div>
          </div>

          {/* Search Status */}
          {party === "" || selectedDate === "" ? (
            <div className="text-center py-8">
              <div className="text-slate-400 text-lg">
                <Spark /> Select party size and date to discover available tables
              </div>
            </div>
          ) : (
            <div className="text-center text-green-400 font-medium">
              <Spark /> Searching for tables for {party} people on{" "}
              {new Date(selectedDate).toLocaleDateString()}...
            </div>
          )}
        </div>
      </section>

      {/* TONIGHT NEAR YOU SECTION */}
      <TonightNearYou tonight={tonight} todayLabel={todayLabel} />

      {/* WEEK VIEW */}
      {party !== "" && selectedDate && (
        <section>
          <SectionTitle>This Week</SectionTitle>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {week.days.map((day) => (
              <div
                key={day.date}
                className={`p-4 rounded-lg border ${
                  day.date === selectedDate
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium text-sm text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString(undefined, {
                      weekday: "short",
                    })}
                  </div>
                  <div className="font-bold text-lg mb-2">
                    {new Date(day.date).getDate()}
                  </div>
                  <div
                    className={`text-xs ${
                      day.available_count > 0
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {day.available_count > 0
                      ? `${day.available_count} available`
                      : "No spots"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CURRENT DAY DETAILS */}
      {weekToday && weekToday.picks.length > 0 && (
        <section>
          <SectionTitle>
            Available Now - {todayLabel} {Spark()}
          </SectionTitle>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {weekToday.picks.map((summary) => (
              <div
                key={summary.restaurant.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {summary.restaurant.emoji && (
                        <span>{summary.restaurant.emoji}</span>
                      )}
                      {summary.restaurant.name}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {summary.restaurant.neighborhood}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {summary.slots.map((slot) => (
                      <Link
                        key={slot.slot_id}
                        to={
                          token
                            ? `/r/${summary.restaurant.slug}?slot_id=${slot.slot_id}`
                            : "/login"
                        }
                        className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-blue-50 transition-colors"
                      >
                        <span className="font-medium">{slot.time}</span>
                        <span className="text-xs text-gray-600">
                          Party of {slot.party_size}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
