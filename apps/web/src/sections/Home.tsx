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

// UserReservations component to display user's reservations
const UserReservations = ({
  user,
  userReservations,
  loadingReservations,
  onReservationsUpdate,
}: {
  user: User | null;
  userReservations: Reservation[];
  loadingReservations: boolean;
  onReservationsUpdate: () => void;
}) => {
  const navigate = useNavigate();

  // Helper functions (moved from Home for component scope)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    return `${hour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
      case "SEATED":
        return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
      case "CANCELLED":
        return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
    }
  };

  // Function to handle cancellation
  const handleCancelReservation = async (reservationId: string) => {
    const token = localStorage.getItem("hogu_token");
    if (!token) return;

    try {
      const response = await fetch(
        `/api/reservations/${reservationId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        console.log(`Reservation ${reservationId} cancelled successfully.`);
        onReservationsUpdate(); // Refresh the list
      } else {
        console.error("Failed to cancel reservation:", response.statusText);
        // Optionally show an error message to the user
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      // Optionally show an error message to the user
    }
  };

  if (!user || userReservations.length === 0) {
    return null;
  }

  return (
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
              />
            </svg>
            Your Reservations
          </h2>
          <Link
            to="/me"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </Link>
        </div>

        {loadingReservations ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-xl p-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {userReservations.slice(0, 3).map((reservation) => (
              <div
                key={reservation.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <span>{reservation.restaurant.emoji || "🍽️"}</span>
                    {reservation.restaurant.name}
                  </h3>
                  <span className={getStatusColor(reservation.status)}>
                    {reservation.status === "PENDING"
                      ? "Pending"
                      : reservation.status === "CONFIRMED"
                        ? "Accepted"
                        : reservation.status === "SEATED"
                          ? "Seated"
                          : reservation.status === "COMPLETED"
                            ? "Completed"
                            : reservation.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"
                      />
                    </svg>
                    {formatDate(reservation.slot.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatTime(reservation.slot.time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {reservation.partySize}{" "}
                    {reservation.partySize === 1 ? "person" : "people"}
                  </span>
                </div>
                {/* Add cancel button for pending reservations */}
                {reservation.status === "PENDING" && (
                  <div className="mt-3 text-right">
                    <button
                      onClick={() => handleCancelReservation(reservation.id)}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {/* Existing "Complete Booking" button (if applicable for other statuses) */}
                {reservation.status === "HELD" && (
                  <div className="mt-3">
                    <button
                      onClick={() => navigate(
                        `/r/${reservation.restaurant.slug}/hold/${reservation.id}`,
                      )}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Complete Booking
                    </button>
                  </div>
                )}
              </div>
            ))}

            {userReservations.length > 3 && (
              <div className="text-center pt-2">
                <Link
                  to="/me"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View all {userReservations.length} reservations →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
  );
};

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

      {/* YOUR RESERVATIONS SECTION */}
      {console.log(
        "Debug - user:",
        !!user,
        "userReservations.length:",
        userReservations.length,
        "userReservations:",
        userReservations,
      )}
      <UserReservations
        user={user}
        userReservations={userReservations}
        loadingReservations={loadingReservations}
        onReservationsUpdate={fetchReservations}
      />

      {/* HERO SECTION — what Hogu is */}
      <section className="relative overflow-hidden rounded-2xl text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
        <div className="relative z-10 px-5 py-8 sm:px-8">
          <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
            <Spark /> <span>Now live in Bengaluru</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
            Plan your week in BLR — guaranteed.
          </h1>
          <p className="mt-2 max-w-2xl opacity-90">
            Hogu finds you real, bookable tables at the city's hardest spots.
            Fair access, stress-free planning, and protection against bots &
            fake accounts.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {token ? (
              <Link to="/explore-tonight" className="btn btn-accent">
                Find a table tonight
              </Link>
            ) : (
              <Link to="/login" className="btn btn-accent">
                Find a table tonight
              </Link>
            )}
            <a href="#week" className="btn bg-white text-brand">
              Plan the week
            </a>
            {!token && (
              <Link to="/login" className="btn btn-primary">
                Log in
              </Link>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm opacity-95">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium">Fair drops & notifies</div>
              <div className="opacity-90">
                Structured releases & instant pings. No FOMO refresh wars.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium">No-bot protection</div>
              <div className="opacity-90">
                Verified identities & throttling keep access clean.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium">Card holds & deposits</div>
              <div className="opacity-90">
                Reduces no-shows so more real seats are available.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TONIGHT NEAR YOU */}
      <section id="tonight" className="space-y-3">
        <TonightNearYou city={city} />
      </section>

      {/* WHAT PROBLEMS WE SOLVE */}
      <section
        id="why"
        className="relative overflow-hidden rounded-2xl text-white"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
        <div className="relative z-10 px-5 py-8 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">
                "Everything sells out in minutes."
              </div>
              <div className="opacity-90 text-sm">
                We run timed <strong>drops</strong> & fair queues. No spam, no
                scalpers.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">
                "I hate refreshing for cancels."
              </div>
              <div className="opacity-90 text-sm">
                <strong>Notify</strong> pings you instantly and auto-holds a
                table for a short window.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">
                "Last-minute plans? Forget it."
              </div>
              <div className="opacity-90 text-sm">
                <strong>Tonight Near You</strong> shows live inventory for the
                next few hours.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 1-2-3 */}
      <section
        id="how"
        className="relative overflow-hidden rounded-2xl text-white"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
        <div className="relative z-10 px-5 py-8 sm:px-8 space-y-3">
          <h2 className="text-xl font-semibold">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="font-medium">Search & Pick</div>
              </div>
              <div className="opacity-90 text-sm">
                Choose party size and the day — we show live inventory from top
                spots.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="font-medium">Hold & Confirm</div>
              </div>
              <div className="opacity-90 text-sm">
                Tap a time to hold it. If a deposit's required, add a card and
                you're locked.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="font-medium">Get Notified</div>
              </div>
              <div className="opacity-90 text-sm">
                Join Notifies for sold-out times. If a table opens, we'll ping
                you instantly.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / ANTI-SCAM */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-4">
        <p className="font-medium">No bots. No fake accounts. No resale.</p>
        <p className="text-sm mt-1">
          Hogu verifies identities and uses queue fairness, throttling, and
          chargeable holds to keep things clean. Your booking is yours — not a
          scalper's.
        </p>
      </section>

      {/* FOOTNOTE: separate restaurant endpoint */}
      <footer className="text-muted text-xs">
        Are you a restaurant?{" "}
        <Link to="/restaurant/login" className="underline">
          Sign in here
        </Link>
        .
      </footer>
    </div>
  );
}

/** Inline components to keep this file drop-in friendly */
function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="font-medium mb-1">{title}</div>
      <div className="text-muted text-sm">{children}</div>
    </div>
  );
}
function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm">
          {n}
        </div>
        <div className="font-medium">{title}</div>
      </div>
      <div className="text-muted text-sm">{children}</div>
    </div>
  );
}