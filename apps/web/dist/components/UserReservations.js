import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
export default function UserReservations({ user, userReservations, loadingReservations, onReservationsUpdate }) {
    const navigate = useNavigate();
    // Helper functions
    const formatTime = (time) => {
        const [hours, minutes] = time.split(":");
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        hour = hour ? hour : 12; // the hour '0' should be '12'
        return `${hour}:${minutes} ${ampm}`;
    };
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === today.toDateString()) {
            return "Today";
        }
        else if (date.toDateString() === tomorrow.toDateString()) {
            return "Tomorrow";
        }
        else {
            return date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            });
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium";
            case "CONFIRMED":
                return "bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium";
            case "SEATED":
                return "bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium";
            case "COMPLETED":
                return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
            case "CANCELLED":
                return "bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium";
            default:
                return "bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium";
        }
    };
    // Function to handle cancellation
    const handleCancelReservation = async (reservationId) => {
        const token = localStorage.getItem("hogu_token");
        if (!token)
            return;
        try {
            const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (response.ok) {
                console.log(`Reservation ${reservationId} cancelled successfully.`);
                onReservationsUpdate(); // Refresh the list
            }
            else {
                console.error("Failed to cancel reservation:", response.statusText);
                // Optionally show an error message to the user
            }
        }
        catch (error) {
            console.error("Error cancelling reservation:", error);
            // Optionally show an error message to the user
        }
    };
    if (!user || userReservations.length === 0) {
        return null;
    }
    return (_jsxs("section", { className: "bg-white rounded-2xl p-6 shadow-sm border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5 text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" }) }), "Your Reservations"] }), _jsx(Link, { to: "/me", className: "text-sm text-blue-600 hover:text-blue-800 font-medium", children: "View All \u2192" })] }), loadingReservations ? (_jsx("div", { className: "space-y-3", children: [...Array(2)].map((_, i) => (_jsxs("div", { className: "border border-gray-200 rounded-xl p-4 animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/2" })] }, i))) })) : (_jsxs("div", { className: "space-y-3", children: [userReservations.slice(0, 3).map((reservation) => (_jsxs("div", { className: "border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h3", { className: "font-medium flex items-center gap-2", children: [_jsx("span", { children: reservation.restaurant.emoji || "🍽️" }), reservation.restaurant.name] }), _jsx("span", { className: getStatusColor(reservation.status), children: reservation.status === "PENDING"
                                            ? "Pending"
                                            : reservation.status === "CONFIRMED"
                                                ? "Accepted"
                                                : reservation.status === "SEATED"
                                                    ? "Seated"
                                                    : reservation.status === "COMPLETED"
                                                        ? "Completed"
                                                        : reservation.status })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-600", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" }) }), formatDate(reservation.slot.date)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" }) }), formatTime(reservation.slot.time)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" }) }), reservation.partySize, " ", reservation.partySize === 1 ? "person" : "people"] })] }), reservation.status === "PENDING" && (_jsx("div", { className: "mt-3 text-right", children: _jsx("button", { onClick: () => handleCancelReservation(reservation.id), className: "px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors", children: "Cancel" }) })), reservation.status === "HELD" && (_jsx("div", { className: "mt-3", children: _jsx("button", { onClick: () => navigate(`/r/${reservation.restaurant.slug}/hold/${reservation.id}`), className: "px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "Complete Booking" }) }))] }, reservation.id))), userReservations.length > 3 && (_jsx("div", { className: "text-center pt-2", children: _jsxs(Link, { to: "/me", className: "text-blue-600 hover:text-blue-800 font-medium text-sm", children: ["View all ", userReservations.length, " reservations \u2192"] }) }))] }))] }));
}
