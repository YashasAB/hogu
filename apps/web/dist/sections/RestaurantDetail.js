import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
// Generate demo time slots
const generateTimeSlots = () => {
    const times = [
        "6:00 PM",
        "6:30 PM",
        "7:00 PM",
        "7:30 PM",
        "8:00 PM",
        "8:30 PM",
        "9:00 PM",
        "9:30 PM",
        "10:00 PM",
    ];
    return times.map((t, i) => ({
        id: `slot-${i}`,
        time: t,
        available: Math.random() > 0.3,
    }));
};
const Badge = ({ children }) => (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-amber-500 shadow-sm border border-white/10", children: children }));
const Chip = ({ active, children, }) => (_jsx("span", { className: `px-3 py-1 rounded-full text-sm font-medium border transition ${active
        ? "text-white bg-gradient-to-r from-rose-700 to-amber-600 border-transparent shadow"
        : "text-slate-200 bg-slate-800 border-slate-600 hover:border-rose-500/40"}`, children: children }));
const Row = ({ label, last, children }) => (_jsxs("div", { className: `flex items-center justify-between py-3 ${last ? "" : "border-b border-white/10"}`, children: [_jsx("span", { className: "text-slate-300", children: label }), _jsx("span", { className: "text-slate-400", children: children })] }));
export default function RestaurantDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    // Fetch restaurant data
    useEffect(() => {
        const fetchRestaurant = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/restaurants/${slug}`);
                console.log("Restaurant API response status:", response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log("Restaurant data received from API:", data);
                    console.log("Hero image URL in restaurant data:", data.heroImageUrl);
                    setRestaurant(data);
                }
                else {
                    console.error("Restaurant not found in API");
                    setRestaurant(null);
                }
            }
            catch (error) {
                console.error("Error fetching restaurant:", error);
                setRestaurant(null);
            }
            finally {
                setLoading(false);
            }
        };
        fetchRestaurant();
    }, [slug]);
    const [date, setDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    });
    const [partySize, setPartySize] = useState(2);
    const [timeSlots, setTimeSlots] = useState(generateTimeSlots());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const bookingRef = useRef(null);
    // Fetch availability when date, party size, or restaurant changes
    useEffect(() => {
        const fetchAvailability = async () => {
            if (!restaurant || !date || !partySize)
                return;
            try {
                const response = await fetch(`/api/restaurants/${restaurant.slug}/availability?date=${date}&partySize=${partySize}`);
                if (response.ok) {
                    const data = await response.json();
                    setTimeSlots(data);
                }
                else {
                    // Fallback to generated time slots
                    setTimeSlots(generateTimeSlots());
                }
            }
            catch (error) {
                console.error("Failed to fetch availability:", error);
                // Fallback to generated time slots
                setTimeSlots(generateTimeSlots());
            }
            setSelectedSlot(null);
        };
        fetchAvailability();
    }, [restaurant, date, partySize]);
    const handleReserveNow = async () => {
        if (!selectedSlot) {
            alert("Please select a time slot");
            return;
        }
        const token = localStorage.getItem("hogu_token");
        if (!token) {
            navigate("/login");
            return;
        }
        const slot = timeSlots.find((s) => s.id === selectedSlot);
        if (!slot)
            return;
        try {
            const response = await fetch("/api/reservations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    restaurantSlug: restaurant?.slug,
                    date: date,
                    time: slot.time,
                    partySize: partySize,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error || "Failed to create reservation");
                return;
            }
            alert(`Reservation created! Status: ${data.status}\n${restaurant?.name} on ${date} at ${slot?.time} for ${partySize} ${partySize === 1 ? "person" : "people"}`);
            // Reset selection and navigate to home
            setSelectedSlot(null);
            navigate("/");
        }
        catch (error) {
            console.error("Reservation error:", error);
            alert("Failed to create reservation. Please try again.");
        }
    };
    const handleMobileCTA = () => {
        const token = localStorage.getItem("hogu_token");
        if (!token) {
            navigate("/login");
            return;
        }
        if (selectedSlot) {
            handleReserveNow();
        }
        else {
            bookingRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center", children: _jsx("div", { className: "text-center space-y-4", children: _jsx("h1", { className: "text-2xl font-semibold", children: "Loading..." }) }) }));
    }
    if (!restaurant) {
        return (_jsx("div", { className: "min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Restaurant not found" }), _jsx("p", { className: "text-slate-400", children: "The restaurant you're looking for doesn't exist." }), _jsx(Link, { to: "/explore-tonight", className: "btn btn-primary", children: "\u2190 Back to Explore" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-dvh bg-slate-950 text-slate-100 pb-28 md:pb-0", style: { paddingTop: "env(safe-area-inset-top)" }, children: [_jsx("div", { className: "sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-slate-950/70", children: _jsxs("div", { className: "max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,.18)]" }), _jsx("div", { className: "text-sm opacity-80", children: "Explore \u00B7 Bengaluru" }), _jsx("div", { className: "ml-auto", children: _jsx(Link, { to: "/explore-tonight", className: "px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-sm font-medium hover:bg-slate-800/80", children: "\u2190 Back to Map" }) })] }) }), _jsxs("div", { className: "max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10", children: [_jsxs("div", { className: "relative rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-xl", children: [_jsx("img", { src: restaurant.heroImageUrl || `/api/restaurant/${restaurant.id}/hero-image`, alt: restaurant.name, className: "w-full h-[38vh] sm:h-[42vh] md:h-[56vh] object-cover", style: {
                                    display: "block",
                                    width: "100%",
                                    height: "38vh",
                                    objectFit: "cover",
                                    backgroundColor: "#f3f4f6",
                                }, loading: "eager", onError: (e) => {
                                    console.error("=== HERO IMAGE LOAD ERROR ===");
                                    console.error("Failed to load image URL:", e.currentTarget.src);
                                    console.error("heroImageUrl from data:", restaurant.heroImageUrl);
                                    console.error("==============================");
                                    // Try dynamic endpoint if direct URL failed and we haven't already tried it
                                    if (!e.currentTarget.src.includes('/hero-image') && !e.currentTarget.src.includes('placeholder')) {
                                        console.log("Trying dynamic hero image endpoint...");
                                        e.currentTarget.src = `/api/restaurant/${restaurant.id}/hero-image`;
                                    }
                                    else if (e.currentTarget.src !== "/api/placeholder/400/300") {
                                        // Fallback to placeholder if all attempts fail
                                        e.currentTarget.src = "/api/placeholder/400/300";
                                    }
                                }, onLoad: (e) => {
                                    console.log("=== HERO IMAGE LOADED SUCCESSFULLY ===");
                                    console.log("Loaded image URL:", restaurant.heroImageUrl);
                                    console.log("Image dimensions:", {
                                        width: e.currentTarget.width,
                                        height: e.currentTarget.height,
                                        naturalWidth: e.currentTarget.naturalWidth,
                                        naturalHeight: e.currentTarget.naturalHeight,
                                    });
                                    console.log("Image computed styles:", {
                                        display: window.getComputedStyle(e.currentTarget).display,
                                        visibility: window.getComputedStyle(e.currentTarget).visibility,
                                        opacity: window.getComputedStyle(e.currentTarget).opacity,
                                        position: window.getComputedStyle(e.currentTarget).position,
                                        zIndex: window.getComputedStyle(e.currentTarget).zIndex,
                                    });
                                    console.log("======================================");
                                } }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8", children: _jsxs("div", { className: "flex items-end justify-between gap-3 md:gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 md:gap-3 mb-2", children: [_jsx("span", { className: "text-2xl drop-shadow", children: restaurant.emoji }), restaurant.hot && _jsx(Badge, { children: "\uD83D\uDD25 HOT" }), _jsx(Chip, { active: true, children: restaurant.neighborhood })] }), _jsx("h1", { className: "text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm", children: restaurant.name }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: restaurant.cuisineTags?.map((t) => (_jsx(Badge, { children: t }, t))) })] }), _jsxs("div", { className: "hidden sm:flex gap-2", children: [restaurant.instagramUrl && (_jsx("a", { href: restaurant.instagramUrl, target: "_blank", rel: "noopener noreferrer", className: "px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium", children: _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDCF8" }), _jsx("span", { children: "Instagram" })] }) })), restaurant.website && (_jsx("a", { href: restaurant.website, target: "_blank", rel: "noopener noreferrer", className: "px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium", children: "Website" }))] })] }) })] }), _jsxs("div", { className: "mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4 sm:space-y-6", children: [_jsxs("section", { className: "rounded-2xl p-4 sm:p-5 ring-1 ring-white/10 bg-slate-900/70", children: [_jsx("h2", { className: "text-lg sm:text-xl font-semibold mb-3", children: "About" }), _jsxs("div", { className: "divide-y divide-white/10", children: [_jsx(Row, { label: "Neighborhood", children: restaurant.neighborhood }), _jsx(Row, { label: "Category", last: true, children: _jsx("span", { className: "capitalize", children: restaurant.category }) })] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [restaurant.instagramUrl && (_jsx("a", { href: restaurant.instagramUrl, target: "_blank", rel: "noopener noreferrer", className: "px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm font-medium hover:bg-slate-800/80", children: _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDCF8" }), _jsx("span", { children: "Instagram" })] }) })), restaurant.website && (_jsx("a", { href: restaurant.website, target: "_blank", rel: "noopener noreferrer", className: "px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm font-medium hover:bg-slate-800/80", children: "Website" })), _jsx("a", { className: "px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 text-sm font-semibold shadow hover:opacity-95", href: `https://www.openstreetmap.org/?mlat=${restaurant.position.lat}&mlon=${restaurant.position.lng}#map=17/${restaurant.position.lat}/${restaurant.position.lng}`, target: "_blank", rel: "noopener noreferrer", children: "View on map" })] })] }), _jsxs("section", { className: "rounded-2xl p-4 sm:p-5 ring-1 ring-white/10 bg-slate-900/70", children: [_jsx("h2", { className: "text-lg sm:text-xl font-semibold mb-3", children: "Coordinates" }), _jsxs("div", { className: "text-sm opacity-80", children: [restaurant.position.lat.toFixed(6), ",", " ", restaurant.position.lng.toFixed(6)] })] })] }), _jsx("aside", { className: "lg:col-span-1", ref: bookingRef, children: _jsxs("div", { className: "rounded-2xl p-4 sm:p-5 ring-1 ring-white/10 bg-slate-900/80 shadow-xl lg:sticky lg:top-20", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-rose-500" }), _jsx("h2", { className: "text-base sm:text-lg font-semibold", children: "Make a reservation" })] }), _jsx("label", { className: "block text-sm mb-1", children: "Date" }), _jsx("input", { type: "date", className: "h-12 w-full rounded-xl bg-slate-800 border border-white/10 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30", value: date, min: new Date().toISOString().split("T")[0], onChange: (e) => setDate(e.target.value) }), _jsx("label", { className: "block text-sm mb-1", children: "Party size" }), _jsx("select", { className: "w-full mb-4 px-3 py-2 h-12 rounded-xl bg-slate-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/30", value: partySize, onChange: (e) => setPartySize(parseInt(e.target.value)), children: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (_jsxs("option", { value: n, children: [n, " ", n === 1 ? "person" : "people"] }, n))) }), _jsx("h3", { className: "text-sm font-medium mb-2", children: "Available times" }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4", children: timeSlots.map((slot) => {
                                                const selected = selectedSlot === slot.id;
                                                const base = "px-3 h-12 rounded-xl text-sm font-semibold border transition";
                                                return (_jsx("button", { disabled: !slot.available, onClick: () => slot.available && setSelectedSlot(slot.id), className: [
                                                        base,
                                                        selected &&
                                                            "bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 border-transparent",
                                                        !selected &&
                                                            slot.available &&
                                                            "bg-slate-800 border-white/10 hover:border-rose-500/30",
                                                        !slot.available &&
                                                            "bg-slate-800/40 border-white/5 text-slate-500 cursor-not-allowed",
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" "), children: slot.time }, slot.id));
                                            }) }), _jsxs("div", { className: "hidden md:block", children: [_jsx("button", { onClick: handleReserveNow, disabled: !selectedSlot, className: `w-full py-3 rounded-2xl font-bold shadow-lg transition ${selectedSlot
                                                        ? "bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 hover:opacity-95"
                                                        : "bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5"}`, children: selectedSlot ? "Reserve now" : "Select a time slot" }), _jsx("p", { className: "mt-3 text-xs opacity-70", children: "You won't be charged yet. Confirmation depends on restaurant availability." })] })] }) })] })] }), _jsx("div", { className: "fixed inset-x-0 bottom-0 md:hidden bg-slate-950/85 backdrop-blur border-t border-white/10 p-3", style: { paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }, children: _jsx("button", { onClick: handleMobileCTA, className: `w-full h-12 rounded-2xl font-bold shadow-lg transition ${selectedSlot
                        ? "bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 hover:opacity-95"
                        : "bg-slate-800/60 text-slate-300 border border-white/5"}`, children: selectedSlot ? "Reserve now" : "Select a time slot" }) })] }));
}
