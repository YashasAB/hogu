import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveStatusCard } from "./components/LiveStatusCard";
import { BookingsList } from "./components/BookingsList";
import { SlotManagement } from "./components/SlotManagement";
import { RestaurantProfile } from "./components/RestaurantProfile";
// API functions
const api = {
    async getRestaurant() {
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
    async updateRestaurant(data) {
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
    async getSlots(date) {
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
    async getBookings() {
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
    async addSlots({ date, start, end, interval, capacity, }) {
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
    async updateSlotStatus(slotId, status) {
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
    async updateBookingStatus(bookingId, status) {
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
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [liveTick, setLiveTick] = useState(0);
    const [activeTab, setActiveTab] = useState("dashboard");
    // Restaurant profile state
    const [restaurant, setRestaurant] = useState(null);
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
    // Auto-refresh every 5 minutes
    useEffect(() => {
        const timer = setInterval(() => {
            setLiveTick((tick) => tick + 1);
            refresh();
        }, 300000);
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
        }
        catch (error) {
            console.error("Error fetching restaurant:", error);
            navigate("/restaurant-login");
        }
    };
    // Function to fetch slots, added logging
    const fetchSlots = async () => {
        console.log(`🔍 fetchSlots called for date: ${date}`);
        try {
            const token = localStorage.getItem("hogu_restaurant_token");
            console.log("🔍 Token exists:", !!token);
            const response = await fetch(`/api/admin/slots?date=${date}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log("🔍 Slots response status:", response.status);
            console.log("🔍 Slots response ok:", response.ok);
            if (response.ok) {
                const data = await response.json();
                console.log("🔍 Slots data received:", data);
                setSlots(data);
            }
            else {
                console.error("🔍 Failed to fetch slots, status:", response.status);
            }
        }
        catch (error) {
            console.error("🔍 Error fetching slots:", error);
        }
    };
    const refresh = async () => {
        console.log("🔄 refresh() called, restaurant exists:", !!restaurant);
        // Remove the restaurant check - we can fetch data even before restaurant profile is loaded
        // The API calls use the token which contains the restaurant ID
        console.log("🔄 refresh() proceeding to fetch data");
        setLoading(true);
        try {
            console.log("🔄 About to fetch slots and bookings...");
            const [slotsData, bookingsData] = await Promise.all([
                api.getSlots(date),
                api.getBookings(),
            ]);
            console.log("🔄 Received slots:", slotsData.length, "bookings:", bookingsData.length);
            setSlots(slotsData);
            setBookings(bookingsData);
            // Calculate live status from bookings
            const pending = bookingsData.filter((b) => b.status === "PENDING" || b.status === "HELD").length;
            const confirmed = bookingsData.filter((b) => b.status === "CONFIRMED" || b.status === "SEATED").length;
            const completed = bookingsData.filter((b) => b.status === "COMPLETED").length;
            setLiveStatus({ pending, confirmed, completed });
        }
        catch (error) {
            console.error("Error refreshing data:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem("hogu_restaurant_token");
        navigate("/restaurant-login");
    };
    const handleSlotStatusChange = async (slotId, newStatus) => {
        try {
            await api.updateSlotStatus(slotId, newStatus);
            refresh();
        }
        catch (error) {
            console.error("Error updating slot status:", error);
        }
    };
    const handleBookingStatusChange = async (bookingId, newStatus) => {
        try {
            await api.updateBookingStatus(bookingId, newStatus);
            refresh();
        }
        catch (error) {
            console.error("Error updating booking status:", error);
        }
    };
    const handleAddSlots = async (data) => {
        try {
            const result = await api.addSlots(data);
            console.log(`Created ${result.created} slots`);
            refresh();
        }
        catch (error) {
            console.error("Error adding slots:", error);
        }
    };
    const handleProfileSave = async () => {
        setProfileLoading(true);
        try {
            const updatedRestaurant = await api.updateRestaurant(profileData);
            setRestaurant(updatedRestaurant);
            alert("Profile updated successfully!");
        }
        catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile");
        }
        finally {
            setProfileLoading(false);
        }
    };
    const handleProfileDataChange = (data) => {
        setProfileData(prev => ({ ...prev, ...data }));
    };
    if (!restaurant) {
        return (_jsx("div", { className: "min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 text-slate-100", children: [_jsx("header", { className: "border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: restaurant.name }), _jsx("p", { className: "text-sm text-slate-400", children: "Restaurant Admin" })] }), _jsxs("div", { className: "flex space-x-1 bg-slate-800 rounded-lg p-1", children: [_jsx("button", { onClick: () => setActiveTab("dashboard"), className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "dashboard"
                                            ? "bg-rose-600 text-white"
                                            : "text-slate-400 hover:text-white"}`, children: "Dashboard" }), _jsx("button", { onClick: () => setActiveTab("profile"), className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "profile"
                                            ? "bg-rose-600 text-white"
                                            : "text-slate-400 hover:text-white"}`, children: "Profile" })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-xs text-slate-500", children: ["Live ", liveTick % 2 === 0 ? "●" : "○"] }), _jsx("button", { onClick: handleLogout, className: "text-slate-400 hover:text-white text-sm", children: "Logout" })] })] }) }) }), _jsx("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: activeTab === "dashboard" ? (_jsxs(_Fragment, { children: [_jsx(LiveStatusCard, { pending: liveStatus.pending, confirmed: liveStatus.confirmed, completed: liveStatus.completed, liveTick: liveTick }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx(BookingsList, { bookings: bookings, loading: loading, onStatusChange: handleBookingStatusChange }), _jsx(SlotManagement, { date: date, slots: slots, loading: loading, onDateChange: setDate, onSlotStatusChange: handleSlotStatusChange, onAddSlots: handleAddSlots })] })] })) : (_jsx("div", { className: "max-w-2xl mx-auto", children: _jsx(RestaurantProfile, { restaurant: restaurant, profileData: profileData, loading: profileLoading, onDataChange: handleProfileDataChange, onSave: handleProfileSave }) })) })] }));
}
