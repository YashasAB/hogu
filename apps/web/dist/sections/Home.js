import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/web/src/sections/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
    const renderUserGreeting = () => {
        if (!user) {
            return null; // Explicitly return null if the user is not available
        }
        return (_jsx("section", { className: "bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-lg", children: user.name?.charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900", children: ["Hello ", user.name, "!"] }), _jsx("p", { className: "text-gray-600", children: "Welcome back to Hogu. Ready to discover tonight's hottest spots?" })] })] }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    setShowUserDropdown(!showUserDropdown);
                                }, className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors", children: [_jsx("span", { className: "font-medium text-gray-900", children: user.username }), _jsx("svg", { className: `w-4 h-4 transition-transform ${showUserDropdown ? "rotate-180" : ""}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }), showUserDropdown && (_jsx("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50", children: _jsxs("div", { className: "py-1", children: [_jsxs(Link, { to: "/me", className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", onClick: () => setShowUserDropdown(false), children: [_jsx("svg", { className: "w-4 h-4 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }), "My Profile"] }), _jsxs(Link, { to: "/me", className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100", onClick: () => setShowUserDropdown(false), children: [_jsx("svg", { className: "w-4 h-4 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), "My Reservations"] }), _jsxs("button", { onClick: () => handleLogout(), className: "flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50", children: [_jsx("svg", { className: "w-4 h-4 mr-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" }) }), "Logout"] })] }) }))] })] }) }));
    };
    // --- UI ---
    return (_jsxs("div", { className: "space-y-8 mx-4 sm:mx-6 lg:mx-8", children: [renderUserGreeting(), console.log("Debug - user:", !!user, "userReservations.length:", userReservations.length, "userReservations:", userReservations), user && userReservations.length > 0 ? (_jsx(UserReservations, { user: user, userReservations: userReservations, loadingReservations: loadingReservations, onReservationsUpdate: fetchReservations })) : null, _jsxs("section", { className: "relative overflow-hidden rounded-2xl text-white", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-brand to-brand/80" }), _jsxs("div", { className: "relative z-10 px-5 py-8 sm:px-8", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm opacity-90 mb-2", children: [_jsx(Spark, {}), " ", _jsx("span", { children: "Now live in Bengaluru" })] }), _jsx("h1", { className: "text-3xl sm:text-4xl font-semibold leading-tight", children: "Plan your week in BLR \u2014 guaranteed." }), _jsx("p", { className: "mt-2 max-w-2xl opacity-90", children: "Hogu finds you real, bookable tables at the city's hardest spots. Fair access, stress-free planning, and protection against bots & fake accounts." }), _jsxs("div", { className: "mt-5 flex flex-wrap gap-2", children: [token ? (_jsx(Link, { to: "/explore-tonight", className: "btn btn-accent", children: "Find a table tonight" })) : (_jsx(Link, { to: "/login", className: "btn btn-accent", children: "Find a table tonight" })), _jsx("a", { href: "#week", className: "btn bg-white text-brand", children: "Plan the week" }), !token && (_jsx(Link, { to: "/login", className: "btn btn-primary", children: "Log in" }))] }), _jsxs("div", { className: "mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm opacity-95", children: [_jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsx("div", { className: "font-medium", children: "Fair drops & notifies" }), _jsx("div", { className: "opacity-90", children: "Structured releases & instant pings. No FOMO refresh wars." })] }), _jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsx("div", { className: "font-medium", children: "No-bot protection" }), _jsx("div", { className: "opacity-90", children: "Verified identities & throttling keep access clean." })] }), _jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsx("div", { className: "font-medium", children: "Card holds & deposits" }), _jsx("div", { className: "opacity-90", children: "Reduces no-shows so more real seats are available." })] })] })] })] }), _jsx("section", { id: "tonight", className: "space-y-3", children: _jsx(TonightNearYou, { city: city }) }), _jsxs("section", { id: "why", className: "relative overflow-hidden rounded-2xl text-white", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-brand to-brand/80" }), _jsx("div", { className: "relative z-10 px-5 py-8 sm:px-8", children: _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsx("div", { className: "font-medium mb-1", children: "\"Everything sells out in minutes.\"" }), _jsxs("div", { className: "opacity-90 text-sm", children: ["We run timed ", _jsx("strong", { children: "drops" }), " & fair queues. No spam, no scalpers."] })] }), _jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsx("div", { className: "font-medium mb-1", children: "\"I hate refreshing for cancels.\"" }), _jsxs("div", { className: "opacity-90 text-sm", children: [_jsx("strong", { children: "Notify" }), " pings you instantly and auto-holds a table for a short window."] })] }), _jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsx("div", { className: "font-medium mb-1", children: "\"Last-minute plans? Forget it.\"" }), _jsxs("div", { className: "opacity-90 text-sm", children: [_jsx("strong", { children: "Tonight Near You" }), " shows live inventory for the next few hours."] })] })] }) })] }), _jsxs("section", { id: "how", className: "relative overflow-hidden rounded-2xl text-white", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-brand to-brand/80" }), _jsxs("div", { className: "relative z-10 px-5 py-8 sm:px-8 space-y-3", children: [_jsx("h2", { className: "text-xl font-semibold", children: "How it works" }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold", children: "1" }), _jsx("div", { className: "font-medium", children: "Search & Pick" })] }), _jsx("div", { className: "opacity-90 text-sm", children: "Choose party size and the day \u2014 we show live inventory from top spots." })] }), _jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold", children: "2" }), _jsx("div", { className: "font-medium", children: "Hold & Confirm" })] }), _jsx("div", { className: "opacity-90 text-sm", children: "Tap a time to hold it. If a deposit's required, add a card and you're locked." })] }), _jsxs("div", { className: "bg-white/10 rounded-2xl px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold", children: "3" }), _jsx("div", { className: "font-medium", children: "Get Notified" })] }), _jsx("div", { className: "opacity-90 text-sm", children: "Join Notifies for sold-out times. If a table opens, we'll ping you instantly." })] })] })] })] }), _jsxs("section", { className: "rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-4 py-4", children: [_jsx("p", { className: "font-medium", children: "No bots. No fake accounts. No resale." }), _jsx("p", { className: "text-sm mt-1", children: "Hogu verifies identities and uses queue fairness, throttling, and chargeable holds to keep things clean. Your booking is yours \u2014 not a scalper's." })] }), _jsxs("footer", { className: "text-muted text-xs", children: ["Are you a restaurant?", " ", _jsx(Link, { to: "/restaurant/login", className: "underline", children: "Sign in here" }), "."] })] }));
}
/** Inline components to keep this file drop-in friendly */
function Feature({ title, children, }) {
    return (_jsxs("div", { className: "card", children: [_jsx("div", { className: "font-medium mb-1", children: title }), _jsx("div", { className: "text-muted text-sm", children: children })] }));
}
function Step({ n, title, children, }) {
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-sm", children: n }), _jsx("div", { className: "font-medium", children: title })] }), _jsx("div", { className: "text-muted text-sm", children: children })] }));
}
