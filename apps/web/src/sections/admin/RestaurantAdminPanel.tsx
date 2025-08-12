
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Types
type SlotStatus = "open" | "held" | "booked" | "closed";
type BookingStatus = "booked" | "seated" | "cancelled" | "no-show";

type Slot = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  capacity: number; // seats available for the slot
  status: SlotStatus;
  bookingId?: string | null;
};

type Booking = {
  id: string;
  slotId: string;
  guestName: string;
  phone?: string;
  partySize: number;
  status: BookingStatus;
  createdAt: string; // ISO
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  neighborhood: string;
  instagramUrl?: string;
  website?: string;
  heroImageUrl?: string;
};

// Mock API functions (replace with real API calls)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
let _slots: Slot[] = [];
let _bookings: Booking[] = [];

// Seed demo data
(function seed() {
  const today = new Date();
  const d = today.toISOString().split('T')[0];
  const times = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
  _slots = times.map((t, i) => ({
    id: `s-${i}`,
    date: d,
    time: t,
    capacity: Math.random() > 0.2 ? 4 : 2,
    status: Math.random() < 0.15 ? "booked" : "open",
    bookingId: null,
  }));
  
  _slots.filter(s => s.status === "booked").slice(0, 2).forEach((s, idx) => {
    const b: Booking = {
      id: `b-${idx}`,
      slotId: s.id,
      guestName: idx ? "Ananya Iyer" : "Rohit Kumar",
      phone: "+1 555-0123",
      partySize: 2 + idx,
      status: "booked",
      createdAt: new Date().toISOString(),
    };
    _bookings.push(b);
    s.bookingId = b.id;
  });
})();

const mockAPI = {
  async listSlots(date: string) {
    await delay(300);
    return _slots.filter(s => s.date === date);
  },
  async listBookings(date: string) {
    await delay(300);
    const ids = _slots.filter(s => s.date === date && s.bookingId).map(s => s.bookingId as string);
    return _bookings.filter(b => ids.includes(b.id));
  },
  async addSlots(payload: { date: string; start: string; end: string; interval: number; capacity: number }) {
    await delay(400);
    const toMinutes = (t: string) => {
      const [H, M] = t.split(":").map(Number);
      return H * 60 + M;
    };
    const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const start = toMinutes(payload.start), end = toMinutes(payload.end);
    const created: Slot[] = [];
    for (let m = start; m <= end; m += payload.interval) {
      const id = `s-${Date.now()}-${m}-${Math.random().toString(36).slice(2, 6)}`;
      const slot: Slot = {
        id,
        date: payload.date,
        time: fmt(m),
        capacity: payload.capacity,
        status: "open"
      };
      _slots.push(slot);
      created.push(slot);
    }
    return created;
  },
  async updateSlotStatus(slotIds: string[], status: SlotStatus) {
    await delay(250);
    _slots = _slots.map(s => slotIds.includes(s.id) ? {
      ...s,
      status,
      bookingId: status !== "booked" ? null : s.bookingId
    } : s);
    return true;
  },
  async deleteSlots(slotIds: string[]) {
    await delay(250);
    _slots = _slots.filter(s => !slotIds.includes(s.id));
    return true;
  },
  async freeSlot(slotId: string) {
    await delay(200);
    _slots = _slots.map(s => s.id === slotId ? { ...s, status: "open", bookingId: null } : s);
    return true;
  },
  async setBookingStatus(bookingId: string, status: BookingStatus) {
    await delay(250);
    _bookings = _bookings.map(b => b.id === bookingId ? { ...b, status } : b);
    return true;
  }
};

// UI Components
const Dot: React.FC<{ status: SlotStatus }> = ({ status }) => {
  const map: Record<SlotStatus, string> = {
    open: "bg-emerald-400",
    held: "bg-amber-400",
    booked: "bg-rose-500",
    closed: "bg-slate-500",
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]}`} aria-hidden />;
};

const StatCard: React.FC<{ label: string; value: string | number; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-2xl p-4 ring-1 ring-white/10 bg-slate-900/70">
    <div className="text-xs text-slate-400 mb-1">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
    {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
  </div>
);

const PillBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button
    {...props}
    className={`px-3 h-10 rounded-xl text-sm font-semibold border transition ${className}`}
  >{children}</button>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg sm:text-xl font-semibold">{children}</h2>
);

export default function RestaurantAdminPanel() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [liveTick, setLiveTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  
  // Restaurant profile state
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    neighborhood: '',
    instagramUrl: '',
    website: '',
    heroImageUrl: ''
  });

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('hogu_restaurant_token');
    if (!token) {
      navigate('/restaurant-login');
      return;
    }
    fetchRestaurant();
  }, [restaurantId]);

  const fetchRestaurant = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data);
        setProfileData({
          name: data.name || '',
          neighborhood: data.neighborhood || '',
          instagramUrl: data.instagramUrl || '',
          website: data.website || '',
          heroImageUrl: data.heroImageUrl || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
  };

  const saveProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          neighborhood: profileData.neighborhood,
          instagram_url: profileData.instagramUrl,
          website: profileData.website,
          hero_image_url: profileData.heroImageUrl
        })
      });
      
      if (response.ok) {
        alert('Profile saved successfully!');
        fetchRestaurant();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    const [sl, bk] = await Promise.all([mockAPI.listSlots(date), mockAPI.listBookings(date)]);
    setSlots(sl.sort((a, b) => a.time.localeCompare(b.time)));
    setBookings(bk);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      refresh();
    }
  }, [date, liveTick, activeTab]);

  // Simulate server push every 15s
  useEffect(() => {
    const t = setInterval(() => setLiveTick(x => x + 1), 15000);
    return () => clearInterval(t);
  }, []);

  // Derived stats
  const stat = useMemo(() => {
    const total = slots.length;
    const open = slots.filter(s => s.status === 'open').length;
    const booked = slots.filter(s => s.status === 'booked').length;
    const closed = slots.filter(s => s.status === 'closed').length;
    return { total, open, booked, closed };
  }, [slots]);

  // Slot bulk operations
  const setStatus = async (status: SlotStatus) => {
    if (selectedIds.length === 0) return;
    await mockAPI.updateSlotStatus(selectedIds, status);
    setSelected({});
    refresh();
  };
  
  const deleteSel = async () => {
    if (selectedIds.length === 0) return;
    await mockAPI.deleteSlots(selectedIds);
    setSelected({});
    refresh();
  };
  
  const freeFirst = async () => {
    if (selectedIds[0]) {
      await mockAPI.freeSlot(selectedIds[0]);
      setSelected({});
      refresh();
    }
  };

  // Add slot form state
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("22:00");
  const [interval, setInterval] = useState(30);
  const [capacity, setCapacity] = useState(4);

  const addSlots = async () => {
    await mockAPI.addSlots({ date, start, end, interval, capacity });
    refresh();
  };

  const handleLogout = () => {
    localStorage.removeItem('hogu_restaurant_token');
    navigate('/restaurant-login');
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,.18)]" />
          <div className="text-sm font-medium">{restaurant.name}</div>
          
          {/* Tab Navigation */}
          <div className="ml-4 flex bg-slate-900/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'dashboard' 
                  ? 'bg-rose-500 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'profile' 
                  ? 'bg-rose-500 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Profile
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {activeTab === 'dashboard' && (
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-slate-900/80 border border-white/10 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              />
            )}
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-200 text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 space-y-6">
        {activeTab === 'dashboard' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total slots" value={stat.total} />
              <StatCard label="Open" value={stat.open} />
              <StatCard label="Booked" value={stat.booked} />
              <StatCard label="Closed" value={stat.closed} />
            </div>

            {/* Add slots */}
            <section className="rounded-2xl p-4 ring-1 ring-white/10 bg-slate-900/70">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Add slots</SectionTitle>
                <div className="text-xs text-slate-400">Date: {date}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start</label>
                  <input
                    type="time"
                    value={start}
                    onChange={e => setStart(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-white/10 px-3"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End</label>
                  <input
                    type="time"
                    value={end}
                    onChange={e => setEnd(e.target.value)}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-white/10 px-3"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Interval</label>
                  <select
                    value={interval}
                    onChange={e => setInterval(parseInt(e.target.value))}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-white/10 px-3"
                  >
                    {[15, 20, 30, 45, 60].map(n => (
                      <option key={n} value={n}>{n} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Capacity</label>
                  <select
                    value={capacity}
                    onChange={e => setCapacity(parseInt(e.target.value))}
                    className="w-full h-10 rounded-xl bg-slate-800 border border-white/10 px-3"
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map(n => (
                      <option key={n} value={n}>{n} seats</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <PillBtn
                    onClick={addSlots}
                    className="w-full bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 border-transparent"
                  >
                    Add
                  </PillBtn>
                </div>
              </div>
            </section>

            {/* Bulk actions */}
            <section className="rounded-2xl p-4 ring-1 ring-white/10 bg-slate-900/70">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Manage slots</SectionTitle>
                <div className="text-xs text-slate-400">Selected: {selectedIds.length}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <PillBtn
                  onClick={() => setStatus('open')}
                  className="bg-slate-800 border-white/10 hover:border-emerald-400/40"
                >
                  Open
                </PillBtn>
                <PillBtn
                  onClick={() => setStatus('held')}
                  className="bg-slate-800 border-white/10 hover:border-amber-400/40"
                >
                  Hold
                </PillBtn>
                <PillBtn
                  onClick={() => setStatus('closed')}
                  className="bg-slate-800 border-white/10 hover:border-slate-400/40"
                >
                  Close
                </PillBtn>
                <PillBtn
                  onClick={deleteSel}
                  className="bg-slate-800 border-white/10 hover:border-red-400/40 text-red-400"
                >
                  Delete
                </PillBtn>
                <PillBtn
                  onClick={freeFirst}
                  className="bg-slate-800 border-white/10 hover:border-emerald-400/40"
                >
                  Free
                </PillBtn>
              </div>
            </section>

            {/* Slots grid */}
            <section className="rounded-2xl p-4 ring-1 ring-white/10 bg-slate-900/70">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Time slots</SectionTitle>
                {loading && <div className="text-xs text-slate-400">Refreshing...</div>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map(slot => {
                  const booking = bookings.find(b => b.id === slot.bookingId);
                  const isSelected = selected[slot.id];
                  return (
                    <div
                      key={slot.id}
                      className={`rounded-xl p-3 border cursor-pointer transition ${
                        isSelected
                          ? 'border-rose-400/60 bg-rose-500/10'
                          : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                      }`}
                      onClick={() => setSelected(prev => ({ ...prev, [slot.id]: !prev[slot.id] }))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Dot status={slot.status} />
                          <span className="font-medium">{slot.time}</span>
                        </div>
                        <span className="text-xs text-slate-400">{slot.capacity} seats</span>
                      </div>
                      {booking && (
                        <div className="text-xs text-slate-300">
                          <div>{booking.guestName}</div>
                          <div className="text-slate-500">Party of {booking.partySize}</div>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-1 capitalize">{slot.status}</div>
                    </div>
                  );
                })}
              </div>
              {slots.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No slots found for {date}. Add some slots above to get started.
                </div>
              )}
            </section>

            {/* Current bookings */}
            {bookings.length > 0 && (
              <section className="rounded-2xl p-4 ring-1 ring-white/10 bg-slate-900/70">
                <SectionTitle>Today's bookings</SectionTitle>
                <div className="mt-3 space-y-3">
                  {bookings.map(booking => {
                    const slot = slots.find(s => s.id === booking.slotId);
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                        <div>
                          <div className="font-medium">{booking.guestName}</div>
                          <div className="text-sm text-slate-400">
                            {slot?.time} • Party of {booking.partySize}
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className={`px-2 py-1 rounded-lg ${
                            booking.status === 'booked' ? 'bg-emerald-500/20 text-emerald-400' :
                            booking.status === 'seated' ? 'bg-blue-500/20 text-blue-400' :
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        ) : (
          /* Profile Tab */
          <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <SectionTitle>Restaurant Profile</SectionTitle>
              <div className="text-xs text-slate-400">ID: {restaurantId}</div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={e => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
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
                  onChange={e => setProfileData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  placeholder="e.g., Koramangala, Indiranagar"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={profileData.instagramUrl}
                  onChange={e => setProfileData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                  className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  placeholder="https://instagram.com/yourrestaurant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={e => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
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
                  onChange={e => setProfileData(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                  className="w-full h-12 rounded-xl bg-slate-800 border border-white/10 px-4 text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="pt-4">
                <button
                  onClick={saveProfile}
                  disabled={profileLoading}
                  className="w-full h-12 bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 font-semibold rounded-xl border-transparent transition hover:shadow-lg disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
              
              <div className="text-xs text-slate-500 mt-4 p-3 bg-slate-800/50 rounded-lg">
                <strong>Note:</strong> This is a demo admin panel. In production, this would be protected with proper authentication and role-based access control.
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
