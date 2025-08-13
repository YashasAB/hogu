import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";

type Restaurant = {
  id: string;
  name: string;
  neighborhood: string;
  instagramUrl?: string;
  website?: string;
  heroImageUrl?: string;
};

type Slot = {
  id: string;
  date: string;
  time: string;
  capacity: number;
  status: "available" | "cutoff" | "full";
  bookingId?: string | null;
};

type Booking = {
  id: string;
  slotId: string;
  partySize: number;
  status: "PENDING" | "HELD" | "CONFIRMED" | "CANCELLED" | "SEATED" | "COMPLETED";
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  slot: {
    date: string;
    time: string;
    partySize: number;
  };
};

type SlotStatus = "available" | "cutoff" | "full";
type BookingStatus = "PENDING" | "HELD" | "CONFIRMED" | "CANCELLED" | "SEATED" | "COMPLETED";

// API functions
const api = {
  async getRestaurant(): Promise<Restaurant> {
    const token = localStorage.getItem("hogu_restaurant_token");
    const response = await fetch("/api/admin/restaurant", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch restaurant");
    }
    return response.json();
  },

  async updateRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
    const token = localStorage.getItem("hogu_restaurant_token");
    const response = await fetch("/api/admin/restaurant", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update restaurant");
    }
    return response.json();
  },

  async getSlots(date: string): Promise<Slot[]> {
    const token = localStorage.getItem("hogu_restaurant_token");
    const response = await fetch(`/api/admin/slots?date=${date}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch slots");
    }
    return response.json();
  },

  async getBookings(): Promise<Booking[]> {
    const token = localStorage.getItem("hogu_restaurant_token");
    const response = await fetch("/api/admin/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }
    return response.json();
  },

  async addSlots({
    date,
    start,
    end,
    interval,
    capacity,
  }: {
    date: string;
    start: string;
    end: string;
    interval: number;
    capacity: number;
  }): Promise<{ created: number }> {
    const token = localStorage.getItem("hogu_restaurant_token");
    const response = await fetch("/api/admin/slots/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date, start, end, interval, capacity }),
    });
    if (!response.ok) {
      throw new Error("Failed to add slots");
    }
    return response.json();
  },

  async updateSlotStatus(slotId: string, status: SlotStatus): Promise<void> {
    const token = localStorage.getItem("hogu_restaurant_token");
    const response = await fetch(`/api/admin/slots/${slotId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error("Failed to update slot status");
    }
  },

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
  ): Promise<void> {
    const token = localStorage.getItem("hogu_restaurant_token");
    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error("Failed to update booking status");
    }
  },
};

// UI Components
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <h2 className="text-lg sm:text-xl font-semibold">{children}</h2>;

export default function RestaurantAdminPanel() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [liveTick, setLiveTick] = useState(0);
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile">(
    "dashboard",
  );

  // Restaurant profile state
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    neighborhood: "",
    instagramUrl: "",
    website: "",
    heroImageUrl: "",
  });
  const [liveStatus, setLiveStatus] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
  });

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((id) => selected[id]),
    [selected],
  );

  // Add slot form state
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("22:00");
  const [interval, setInterval] = useState(30);
  const [capacity, setCapacity] = useState(4);

  // Check authentication and fetch restaurant data
  useEffect(() => {
    const token = localStorage.getItem("hogu_restaurant_token");
    if (!token) {
      navigate("/restaurant-login");
      return;
    }
    fetchRestaurant();
  }, [restaurantId, navigate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTick((tick) => tick + 1);
      refresh();
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    refresh();
  }, [date]);

  const fetchRestaurant = async () => {
    try {
      const restaurantData = await api.getRestaurant();
      setRestaurant(restaurantData);
      setProfileData({
        name: restaurantData.name || "",
        neighborhood: restaurantData.neighborhood || "",
        instagramUrl: restaurantData.instagramUrl || "",
        website: restaurantData.website || "",
        heroImageUrl: restaurantData.heroImageUrl || "",
      });
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      navigate("/restaurant-login");
    }
  };

  const refresh = async () => {
    if (!restaurant) return;

    setLoading(true);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        api.getSlots(date),
        api.getBookings(),
      ]);
      setSlots(slotsData);
      setBookings(bookingsData);

      // Calculate live status from bookings
      const pending = bookingsData.filter((b) => b.status === "PENDING" || b.status === "HELD").length;
      const confirmed = bookingsData.filter(
        (b) => b.status === "CONFIRMED" || b.status === "SEATED",
      ).length;
      const completed = bookingsData.filter(
        (b) => b.status === "COMPLETED",
      ).length;
      setLiveStatus({ pending, confirmed, completed });
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSlots = async () => {
    try {
      const result = await api.addSlots({
        date,
        start,
        end,
        interval,
        capacity,
      });
      console.log(`Created ${result.created} slots`);
      refresh();
    } catch (error) {
      console.error("Error adding slots:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("hogu_restaurant_token");
    navigate("/restaurant-login");
  };

  const handleSlotStatusChange = async (
    slotId: string,
    newStatus: SlotStatus,
  ) => {
    try {
      await api.updateSlotStatus(slotId, newStatus);
      refresh();
    } catch (error) {
      console.error("Error updating slot status:", error);
    }
  };

  const handleBookingStatusChange = async (
    bookingId: string,
    newStatus: BookingStatus,
  ) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus);
      refresh();
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    try {
      const updatedRestaurant = await api.updateRestaurant(profileData);
      setRestaurant(updatedRestaurant);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-white">
                {restaurant.name}
              </h1>
              <p className="text-sm text-slate-400">Restaurant Admin</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-rose-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "profile"
                    ? "bg-rose-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Profile
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-xs text-slate-500">
                Live {liveTick % 2 === 0 ? "●" : "○"}
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" ? (
          <>
            {/* Live Status Section */}
            <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70 mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Booking Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending Requests */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-yellow-400">Pending</h3>
                    <span className="text-2xl font-bold text-yellow-400">
                      {liveStatus.pending}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">Awaiting confirmation</p>
                </div>

                {/* Confirmed Bookings */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-green-400">Confirmed</h3>
                    <span className="text-2xl font-bold text-green-400">
                      {liveStatus.confirmed}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">Ready to dine</p>
                </div>

                {/* Completed */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-blue-400">Completed</h3>
                    <span className="text-2xl font-bold text-blue-400">
                      {liveStatus.completed}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">Service complete</p>
                </div>
              </div>
            </section>

            {/* Today's Bookings Section */}
            <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70">
              <SectionTitle>Today's Bookings ({new Date().toLocaleDateString()})</SectionTitle>

              <div className="mt-6 overflow-hidden">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No bookings for today
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium text-white">
                                {booking.user.name || booking.user.email}
                              </p>
                              <p className="text-sm text-slate-400">
                                {booking.slot.time} • Party of {booking.partySize}
                              </p>
                              {booking.user.phone && (
                                <p className="text-xs text-slate-500">{booking.user.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === "PENDING" || booking.status === "HELD"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : booking.status === "CONFIRMED" || booking.status === "SEATED"
                                ? "bg-green-500/20 text-green-400"
                                : booking.status === "COMPLETED"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {booking.status}
                          </span>

                          {booking.status === "PENDING" && (
                            <button
                              onClick={() => handleBookingStatusChange(booking.id, "CONFIRMED")}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors"
                            >
                              Confirm
                            </button>
                          )}

                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() => handleBookingStatusChange(booking.id, "SEATED")}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                            >
                              Seat
                            </button>
                          )}

                          {booking.status === "SEATED" && (
                            <button
                              onClick={() => handleBookingStatusChange(booking.id, "COMPLETED")}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Slot Management Section */}
            <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70">
              <SectionTitle>Slot Management</SectionTitle>
                <div className="bg-orange-900/30 rounded-lg p-4 border border-orange-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-orange-300">
                      Pending Requests
                    </h3>
                    <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                      {liveStatus.pending}
                    </span>
                  </div>
                  <p className="text-sm text-orange-400">
                    Awaiting your confirmation
                  </p>
                </div>

                {/* Confirmed Bookings */}
                <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-blue-300">Confirmed</h3>
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {liveStatus.confirmed}
                    </span>
                  </div>
                  <p className="text-sm text-blue-400">Active reservations</p>
                </div>

                {/* Completed Bookings */}
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-green-300">Completed</h3>
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      {liveStatus.completed}
                    </span>
                  </div>
                  <p className="text-sm text-green-400">
                    Successfully completed
                  </p>
                </div>
              </div>
            </section>

            {/* Date Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Add Slots Section */}
            <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70 mb-8">
              <SectionTitle>Add Time Slots</SectionTitle>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Interval (min)
                  </label>
                  <input
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value))}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addSlots}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg w-full"
                  >
                    Add Slots
                  </button>
                </div>
              </div>
            </section>

            {/* Slots Section */}
            <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70 mb-8">
              <SectionTitle>Time Slots ({date})</SectionTitle>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-slate-400 py-4">No slots for this date.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-slate-800 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="font-mono">{slot.time}</span>
                        <span className="text-slate-400">
                          Capacity: {slot.capacity}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={slot.status}
                          onChange={(e) =>
                            handleSlotStatusChange(
                              slot.id,
                              e.target.value as SlotStatus,
                            )
                          }
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                        >
                          <option value="available">Available</option>
                          <option value="cutoff">Cutoff</option>
                          <option value="full">Full</option>
                        </select>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            slot.status === "available"
                              ? "bg-green-800 text-green-200"
                              : slot.status === "cutoff"
                                ? "bg-yellow-800 text-yellow-200"
                                : "bg-red-800 text-red-200"
                          }`}
                        >
                          {slot.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Bookings Section */}
            <section className="rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70">
              <SectionTitle>Recent Bookings</SectionTitle>
              {bookings.length === 0 ? (
                <p className="text-slate-400 py-4">No bookings yet.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {bookings.slice(0, 10).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between bg-slate-800 p-3 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">
                          {booking.guestName}
                        </span>
                        <span className="text-slate-400">
                          Party of {booking.partySize}
                        </span>
                        {booking.phone && (
                          <span className="text-slate-400">
                            {booking.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={booking.status}
                          onChange={(e) =>
                            handleBookingStatusChange(
                              booking.id,
                              e.target.value as BookingStatus,
                            )
                          }
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
                        >
                          <option value="held">Held</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === "confirmed"
                              ? "bg-green-800 text-green-200"
                              : booking.status === "held"
                                ? "bg-yellow-800 text-yellow-200"
                                : "bg-red-800 text-red-200"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
                <label className="block text-sm font-medium mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  placeholder="Restaurant Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Neighborhood
                </label>
                <input
                  type="text"
                  value={profileData.neighborhood}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      neighborhood: e.target.value,
                    })
                  }
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  placeholder="e.g., Koramangala, Indiranagar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={profileData.instagramUrl}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      instagramUrl: e.target.value,
                    })
                  }
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  placeholder="https://instagram.com/yourrestaurant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) =>
                    setProfileData({ ...profileData, website: e.target.value })
                  }
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  placeholder="https://yourrestaurant.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Hero Image URL
                </label>
                <input
                  type="url"
                  value={profileData.heroImageUrl}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      heroImageUrl: e.target.value,
                    })
                  }
                  className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-full"
                  placeholder="https://example.com/hero-image.jpg"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleProfileSave}
                  disabled={profileLoading}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  {profileLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}