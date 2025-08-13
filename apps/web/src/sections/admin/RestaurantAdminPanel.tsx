import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveStatusCard } from "./components/LiveStatusCard";
import { BookingsList } from "./components/BookingsList";
import { SlotManagement } from "./components/SlotManagement";
import { RestaurantProfile } from "./components/RestaurantProfile";

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

export default function RestaurantAdminPanel() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
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

  const handleAddSlots = async (data: {
    date: string;
    start: string;
    end: string;
    interval: number;
    capacity: number;
  }) => {
    try {
      const result = await api.addSlots(data);
      console.log(`Created ${result.created} slots`);
      refresh();
    } catch (error) {
      console.error("Error adding slots:", error);
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

  const handleProfileDataChange = (data: Partial<typeof profileData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
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
            {/* Live Status */}
            <LiveStatusCard 
              pending={liveStatus.pending}
              confirmed={liveStatus.confirmed}
              completed={liveStatus.completed}
              liveTick={liveTick}
            />

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bookings List */}
              <BookingsList 
                bookings={bookings}
                loading={loading}
                onStatusChange={handleBookingStatusChange}
              />

              {/* Slot Management */}
              <SlotManagement 
                date={date}
                slots={slots}
                loading={loading}
                onDateChange={setDate}
                onSlotStatusChange={handleSlotStatusChange}
                onAddSlots={handleAddSlots}
              />
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <RestaurantProfile 
              restaurant={restaurant}
              profileData={profileData}
              loading={profileLoading}
              onDataChange={handleProfileDataChange}
              onSave={handleProfileSave}
            />
          </div>
        )}
      </main>
    </div>
  );
}