// apps/web/src/sections/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
    <div className="space-y-8">
      {/* HERO — what Hogu is */}
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

      {/* PLAN YOUR WEEK */}
      <section id="week" className="space-y-3">
        <SectionTitle>Plan Your Week</SectionTitle>
        <div className="text-muted text-sm">
          Today is <strong>{todayLabel}</strong>. Pick a day, browse seats, and
          lock plans with card-on-file.
        </div>

        <div className="flex gap-2 overflow-x-auto snap-x">
          {weekDays.map((d, i) => {
            const day = new Date(d.date).toLocaleDateString(undefined, {
              weekday: "short",
            });
            return (
              <button
                key={d.date}
                className={`pill snap-start ${i === 0 ? "bg-brand text-white border-brand" : "border-ink"}`}
                title={`${d.available_count} open slots`}
              >
                <div className="text-sm">
                  {i === 0 ? `${day} (Today)` : day}
                </div>
                <div className="text-xs opacity-70">
                  {d.available_count} slots
                </div>
              </button>
            );
          })}
          {!weekDays.length && (
            <div className="text-muted text-sm">Loading week…</div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(weekToday?.picks || []).map((card) => (
            <Link
              to={`/r/${card.restaurant.slug}`}
              key={card.restaurant.id}
              className="card hover:shadow-lg transition group"
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
          {!!weekDays.length && !weekToday?.picks?.length && (
            <div className="text-muted text-sm">
              No highlighted picks yet. Try a different party size.
            </div>
          )}
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
