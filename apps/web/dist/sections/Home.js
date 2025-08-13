import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/sections/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DarkDatePicker from "../components/DarkDatePicker";
import TonightNearYou from "../components/TonightNearYou"; // Import the new component
import UserReservations from "../components/UserReservations"; // Import the UserReservations component
export default function Home() {
    const [user, setUser] = useState(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [liveStatus, setLiveStatus] = useState({
        pending: 0,
        ongoing: 0,
        completed: 0,
    });
    const [userReservations, setUserReservations] = useState([]);
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
                    }
                    else {
                        localStorage.removeItem("hogu_token");
                        setUser(null);
                    }
                }
                catch (error) {
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
            }
            catch (error) {
                console.error("Failed to fetch data:", error);
            }
            finally {
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
        const handleClickOutside = (event) => {
            const target = event.target;
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
    const [party, setParty] = useState(""); // No default value, user must select
    const [selectedDate, setSelectedDate] = useState(""); // State for the selected date
    const [city] = useState("BLR");
    const [tonight, setTonight] = useState({ now: [], later: [] });
    const [week, setWeek] = useState({ days: [] });
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const token = typeof window !== "undefined" ? localStorage.getItem("hogu_token") : null;
    // --- data fetch ---
    useEffect(() => {
        // Only fetch if party and selectedDate are valid
        if (party !== "" && selectedDate) {
            fetch(`/api/discover/tonight?city=${city}&party_size=${party}&start_date=${selectedDate}`)
                .then((r) => r.json())
                .then(setTonight)
                .catch(() => { });
            fetch(`/api/discover/week?city=${city}&start=${selectedDate}&days=7&party_size=${party}`)
                .then((r) => r.json())
                .then(setWeek)
                .catch(() => { });
        }
        else {
            // Reset data if selections are invalid
            setTonight({ now: [], later: [] });
            setWeek({ days: [] });
        }
    }, [city, party, selectedDate]); // Depend on selectedDate as well
    const weekToday = week.days.find((day) => day.date === selectedDate);
    const todayLabel = useMemo(() => selectedDate
        ? new Date(selectedDate).toLocaleDateString(undefined, {
            weekday: "long",
        })
        : "Select a Date", [selectedDate]);
    // --- UI ---
    const SectionTitle = ({ children }) => (_jsx("h2", { className: "text-xl font-semibold", children: children }));
    const Spark = () => (_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", className: "inline-block align-[-2px]", children: _jsx("path", { d: "M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z", fill: "currentColor" }) }));
    // --- UI ---
    return (_jsxs("div", { className: "space-y-8 mx-4 sm:mx-6 lg:mx-8", children: [user && (_jsx("section", { className: "bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-lg", children: user.name?.charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900", children: ["Hello ", user.name, "!"] }), _jsx("p", { className: "text-gray-600", children: "Welcome back to Hogu. Ready to discover tonight's hottest spots?" })] })] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        setShowUserDropdown(!showUserDropdown);
                                    }, className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors", children: [_jsx("span", { className: "font-medium text-gray-900", children: user.username }), _jsx("svg", { className: `w-4 h-4 transition-transform ${showUserDropdown ? "rotate-180" : ""}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }), showUserDropdown && (_jsx("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50", children: _jsxs("div", { className: "py-1", children: [_jsxs(Link, { to: "/me", className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", onClick: () => setShowUserDropdown(false), children: [_jsx("svg", { className: "w-4 h-4 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }), "My Profile"] }), _jsxs(Link, { to: "/me", className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", onClick: () => setShowUserDropdown(false), children: [_jsx("svg", { className: "w-4 h-4 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), "My Reservations"] }), _jsxs("button", { onClick: handleLogout, className: "flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50", children: [_jsx("svg", { className: "w-4 h-4 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), "Logout"] })] }) }))] })] }) })), user && (_jsx(UserReservations, { user: user, userReservations: userReservations, loadingReservations: loadingReservations, onReservationsUpdate: fetchReservations })), _jsxs("section", { className: "relative overflow-hidden rounded-2xl text-white", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 opacity-90" }), _jsx("div", { className: "absolute inset-0 bg-[url('/api/placeholder/800/400')] bg-cover bg-center opacity-30" }), _jsxs("div", { className: "relative z-10 p-8 sm:p-12 lg:p-16", children: [_jsx("h1", { className: "text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight", children: _jsxs("span", { className: "inline-block", children: ["Discover Bengaluru's", _jsx("br", {}), "Hottest Tables ", _jsx(Spark, {})] }) }), _jsx("p", { className: "text-xl sm:text-2xl mb-8 max-w-2xl opacity-90", children: "Beat the crowds. Book prime-time slots at the city's most coveted restaurants through our exclusive drop system." }), !user && (_jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsx(Link, { to: "/login", className: "bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center", children: "Sign In" }), _jsx(Link, { to: "/signup", className: "border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors text-center", children: "Join Hogu" })] }))] })] }), _jsx("section", { className: "relative z-1 mt-8 rounded-2xl bg-slate-900 text-white p-6 sm:p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("h3", { className: "text-2xl font-bold mb-6 text-center", children: "Find Your Perfect Table" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-300", children: "Party Size" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: [1, 2, 3, 4].map((size) => (_jsx("button", { onClick: () => setParty(size), className: `p-3 rounded-lg border text-center font-medium transition-all ${party === size
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white"}`, children: size === 4 ? "4+" : size }, size))) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-300", children: "Select Date" }), _jsx(DarkDatePicker, { selectedDate: selectedDate, onDateChange: setSelectedDate, today: today })] })] }), party === "" || selectedDate === "" ? (_jsx("div", { className: "text-center py-8", children: _jsxs("div", { className: "text-slate-400 text-lg", children: [_jsx(Spark, {}), " Select party size and date to discover available tables"] }) })) : (_jsxs("div", { className: "text-center text-green-400 font-medium", children: [_jsx(Spark, {}), " Searching for tables for ", party, " people on", " ", new Date(selectedDate).toLocaleDateString(), "..."] }))] }) }), _jsx(TonightNearYou, { tonight: tonight, todayLabel: todayLabel }), party !== "" && selectedDate && (_jsxs("section", { children: [_jsx(SectionTitle, { children: "This Week" }), _jsx("div", { className: "mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4", children: week.days.map((day) => (_jsx("div", { className: `p-4 rounded-lg border ${day.date === selectedDate
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"}`, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "font-medium text-sm text-gray-500 mb-1", children: new Date(day.date).toLocaleDateString(undefined, {
                                            weekday: "short",
                                        }) }), _jsx("div", { className: "font-bold text-lg mb-2", children: new Date(day.date).getDate() }), _jsx("div", { className: `text-xs ${day.available_count > 0
                                            ? "text-green-600"
                                            : "text-gray-400"}`, children: day.available_count > 0
                                            ? `${day.available_count} available`
                                            : "No spots" })] }) }, day.date))) })] })), weekToday && weekToday.picks.length > 0 && (_jsxs("section", { children: [_jsxs(SectionTitle, { children: ["Available Now - ", todayLabel, " ", Spark()] }), _jsx("div", { className: "mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: weekToday.picks.map((summary) => (_jsx("div", { className: "bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow", children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h3", { className: "font-semibold text-lg flex items-center gap-2", children: [summary.restaurant.emoji && (_jsx("span", { children: summary.restaurant.emoji })), summary.restaurant.name] }), _jsx("span", { className: "text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded", children: summary.restaurant.neighborhood })] }), _jsx("div", { className: "space-y-2", children: summary.slots.map((slot) => (_jsxs(Link, { to: token
                                                ? `/r/${summary.restaurant.slug}?slot_id=${slot.slot_id}`
                                                : "/login", className: "flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-blue-50 transition-colors", children: [_jsx("span", { className: "font-medium", children: slot.time }), _jsxs("span", { className: "text-xs text-gray-600", children: ["Party of ", slot.party_size] })] }, slot.slot_id))) })] }) }, summary.restaurant.id))) })] }))] }));
}
