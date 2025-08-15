import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function TodayNearYou({ city }) {
    const navigate = useNavigate();
    const [todayRestaurants, setTodayRestaurants] = useState([]);
    const [todayLoading, setTodayLoading] = useState(false);
    useEffect(() => {
        const fetchAvailableRestaurants = async () => {
            setTodayLoading(true);
            try {
                console.log("Fetching available restaurants from /api/discover/available-today");
                const response = await fetch("/api/discover/available-today");
                console.log("Response status:", response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Available restaurants API response:", data);
                    setTodayRestaurants(data.restaurants || []);
                }
                else {
                    console.error("Failed to fetch available restaurants, status:", response.status);
                    setTodayRestaurants([]);
                }
            }
            catch (error) {
                console.error("Error fetching available restaurants:", error);
                setTodayRestaurants([]);
            }
            finally {
                setTodayLoading(false);
            }
        };
        fetchAvailableRestaurants();
    }, [city]);
    return (_jsxs("section", { id: "today", className: "space-y-3", children: [_jsxs("h2", { className: "text-xl font-semibold flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), "Today Near You"] }), _jsx("div", { className: "text-muted text-sm", children: "Grab something within the next 24 hours \u2014 perfect for spontaneous plans." }), todayLoading ? (_jsx("div", { className: "overflow-x-auto", children: _jsx("div", { className: "flex gap-2 pb-2", style: { width: "max-content" }, children: [...Array(6)].map((_, i) => (_jsxs("div", { className: "w-[calc(26.67%-8px)] min-w-[112px] flex-shrink-0 border border-gray-200 rounded-xl p-3 animate-pulse", children: [_jsx("div", { className: "h-24 bg-gray-200 rounded-lg mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded mb-1" }), _jsx("div", { className: "h-2 bg-gray-200 rounded w-2/3" })] }, i))) }) })) : todayRestaurants.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsx("div", { className: "flex gap-2 pb-2", style: { width: "max-content" }, children: todayRestaurants.map((restaurant) => (_jsxs("div", { className: "w-[calc(26.67%-8px)] min-w-[112px] flex-shrink-0 border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow cursor-pointer", onClick: () => navigate(`/r/${restaurant.restaurant.slug}`), children: [_jsxs("div", { className: "w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg mb-2 p-3 flex flex-col justify-between border border-white/10 hover:border-brand/30 transition-all duration-300", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: restaurant.restaurant.emoji || "🍽️" }), _jsx("div", { className: "text-sm font-bold text-white truncate", children: restaurant.restaurant.name })] }), _jsx("div", { className: "text-xs text-slate-300", children: restaurant.restaurant.neighborhood || "Bengaluru" })] }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [restaurant.slots.slice(0, 2).map((slot, index) => (_jsx("span", { className: "px-2 py-1 bg-slate-100 rounded text-xs text-slate-700", children: slot.time }, slot.slot_id || index))), restaurant.slots.length > 2 && (_jsxs("span", { className: "px-2 py-1 bg-slate-100 rounded text-xs text-slate-700", children: ["+", restaurant.slots.length - 2] }))] })] }, restaurant.restaurant.id))) }) })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3", children: _jsx("span", { className: "text-xl", children: "\uD83D\uDD50" }) }), _jsx("p", { className: "text-gray-500", children: "No availability today" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Check back later or explore week planning above" })] }))] }));
}
