// apps/web/src/sections/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Slot = { slot_id: string; time: string; party_size: number };
type SlotSummary = {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    neighborhood?: string | null;
    hero_image_url?: string | null;
  };
  slots: Slot[];
};
type TonightRes = { now: SlotSummary[]; later: SlotSummary[] };
type WeekDay = { date: string; available_count: number; picks: SlotSummary[] };
type WeekRes = { days: WeekDay[] };

export default function Home() {
  const [user, setUser] = useState<{name: string; username: string; email: string} | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [liveStatus, setLiveStatus] = useState({
    pending: 0,
    ongoing: 0,
    completed: 0
  })

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('hogu_token')
      console.log('Token found:', !!token) // Debug log
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const userData = await response.json()
            console.log('User data:', userData) // Debug log
            setUser(userData)
          } else {
            console.log('Auth failed, clearing token')
            localStorage.removeItem('hogu_token')
            setUser(null)
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('hogu_token')
          setUser(null)
        }
      }
    }
    checkAuth()
  }, [])

  // Fetch pending reservations when user is logged in
  useEffect(() => {
    if (user) {
      const fetchPendingReservations = async () => {
        const token = localStorage.getItem('hogu_token')
        if (token) {
          try {
            const response = await fetch('/api/reservations/pending', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (response.ok) {
              const pending = await response.json()
              setLiveStatus({ pending: pending.length, ongoing: 0, completed: 0 })
            }
          } catch (error) {
            console.error('Failed to fetch pending reservations:', error)
          }
        }
      }
      fetchPendingReservations()
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingReservations, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserDropdown && !target.closest('.relative')) {
        setShowUserDropdown(false);
      }
    }
    
    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserDropdown])

  // Logout function
  const handleLogout = () => {
    console.log('Logging out...')
    localStorage.removeItem('hogu_token')
    setUser(null)
    setShowUserDropdown(false)
    window.location.reload() // Force refresh to reset all state
  }

  // Emergency logout - you can call this from browser console if needed
  window.emergencyLogout = handleLogout

  // --- state ---
  const [party, setParty] = useState(2);
  const [city] = useState("BLR");
  const [tonight, setTonight] = useState<TonightRes>({ now: [], later: [] });
  const [week, setWeek] = useState<WeekRes>({ days: [] });
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const token =
    typeof window !== "undefined" ? localStorage.getItem("hogu_token") : null;

  // --- data fetch ---
  useEffect(() => {
    fetch(`/api/discover/tonight?city=${city}&party_size=${party}`)
      .then((r) => r.json())
      .then(setTonight)
      .catch(() => {});
    fetch(
      `/api/discover/week?city=${city}&start=${today}&days=7&party_size=${party}`,
    )
      .then((r) => r.json())
      .then(setWeek)
      .catch(() => {});
  }, [city, party, today]);

  const weekDays = week.days;
  const weekToday = weekDays[0];
  const todayLabel = useMemo(
    () => new Date(today).toLocaleDateString(undefined, { weekday: "long" }),
    [today],
  );

  // --- helpers ---
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
                <span className="text-white font-bold text-lg">{user.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Hello {user.name}!</h2>
                <p className="text-gray-600">Welcome back to Hogu. Ready to discover tonight's hottest spots?</p>
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
                <span className="font-medium text-gray-900">{user.username}</span>
                <svg className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

      {/* PENDING REQUESTS SECTION */}
      {user && liveStatus.pending > 0 && (
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            Pending Reservation Requests
          </h2>
          
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-orange-800">Awaiting Restaurant Confirmation</h3>
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {liveStatus.pending}
              </span>
            </div>
            <p className="text-sm text-orange-600 mb-3">
              You have {liveStatus.pending} reservation request{liveStatus.pending > 1 ? 's' : ''} waiting for restaurant confirmation.
            </p>
            <Link
              to="/me"
              className="inline-flex items-center text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              View My Reservations
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

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
            <Link to="/explore-tonight" className="btn btn-accent">
              Find a table tonight
            </Link>
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

      {/* QUICK FILTERS / PARTY SIZE + DATE (kept minimal) */}
      <section className="card -mt-10 relative z-[1] grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select
          className="input"
          value={party}
          onChange={(e) => setParty(parseInt(e.target.value))}
          aria-label="Party size"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "person" : "people"}
            </option>
          ))}
        </select>
        <input
          className="input"
          type="date"
          value={today}
          readOnly
          aria-label="Date"
        />
        <div className="hidden sm:flex items-center text-muted text-sm">
          City: Bengaluru
        </div>
        {!token ? (
          <Link to="/login" className="btn btn-primary justify-self-end">
            Log in
          </Link>
        ) : (
          <Link to="/me" className="btn justify-self-end">
            My reservations
          </Link>
        )}
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

      {/* TONIGHT NEAR YOU */}
      <section id="tonight" className="space-y-3">
        <SectionTitle>Tonight Near You</SectionTitle>
        <div className="text-muted text-sm">
          Grab something within the next 4 hours — perfect for spontaneous
          plans.
        </div>

        {/* Horizontal Carousel */}
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4">
            {[...(tonight.now || []), ...(tonight.later || [])].map((card) => (
              <Link
                to={`/r/${card.restaurant.slug}`}
                key={card.restaurant.id}
                className="card hover:shadow-lg transition group flex-shrink-0 w-80"
              >
                {card.restaurant.hero_image_url && (
                  <img
                    src={card.restaurant.hero_image_url}
                    className="w-full h-40 object-cover rounded-xl mb-4 group-hover:scale-105 transition-transform duration-300"
                    alt={card.restaurant.name}
                  />
                )}
                <div className="text-xl font-bold text-brand mb-2">
                  {card.restaurant.name}
                </div>
                <div className="text-muted mb-4">
                  {card.restaurant.neighborhood || "Bengaluru"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.slots.map((s) => (
                    <span key={s.slot_id} className="pill border-ink">
                      {s.time}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Explore More Button */}
        <div className="flex justify-center mt-4">
          <Link to="/explore-tonight" className="btn btn-primary">
            Explore More Tonight
          </Link>
        </div>

        {!(tonight.now?.length || tonight.later?.length) && (
          <div className="text-muted text-sm">
            No live inventory in the next few hours. Check back soon or explore
            week planning above.
          </div>
        )}
      </section>

      {/* FEATURES GRID — everything Hogu offers */}
      <section
        id="features"
        className="relative overflow-hidden rounded-2xl text-white"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
        <div className="relative z-10 px-5 py-8 sm:px-8 space-y-3">
          <h2 className="text-xl font-semibold">Why Hogu works</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">Fair Access (No Bots)</div>
              <div className="opacity-90 text-sm">
                Verified identity, device checks, and rate-limits stop hoarding
                & resale. Everyone gets a fair shot.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">Drops You Can Trust</div>
              <div className="opacity-90 text-sm">
                Transparent release windows. Join once; we'll notify you in
                order. No constant refreshing.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">Instant Notifies</div>
              <div className="opacity-90 text-sm">
                When cancels happen, we ping you immediately and auto-hold a
                table for a short window.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">Card Holds & Deposits</div>
              <div className="opacity-90 text-sm">
                Restaurants reduce no-shows; diners get more real availability,
                not ghost slots.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">Plan the Entire Week</div>
              <div className="opacity-90 text-sm">
                Browse day-by-day inventory and lock plans with friends in
                minutes.
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="font-medium mb-1">Tonight Inventory</div>
              <div className="opacity-90 text-sm">
                See what's actually available right now — counters, bar seats,
                and last-minute releases.
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
                <div className="w-7 h-7 rounded-full bg-white text-brand flex items-center justify-center text-sm font-bold">
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
                <div className="w-7 h-7 rounded-full bg-white text-brand flex items-center justify-center text-sm font-bold">
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
                <div className="w-7 h-7 rounded-full bg-white text-brand flex items-center justify-center text-sm font-bold">
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