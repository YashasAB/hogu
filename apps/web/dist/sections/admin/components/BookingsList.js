import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const BookingsList = ({ bookings, loading, onStatusChange }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
            case "HELD":
                return "bg-amber-500/20 text-amber-300";
            case "CONFIRMED":
                return "bg-green-500/20 text-green-300";
            case "SEATED":
                return "bg-blue-500/20 text-blue-300";
            case "COMPLETED":
                return "bg-purple-500/20 text-purple-300";
            case "CANCELLED":
                return "bg-red-500/20 text-red-300";
            default:
                return "bg-slate-500/20 text-slate-300";
        }
    };
    return (_jsxs("section", { className: "rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70", children: [_jsx("h2", { className: "text-lg sm:text-xl font-semibold mb-6", children: "Upcoming Bookings" }), _jsx("div", { className: "mt-6 overflow-hidden", children: loading ? (_jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => (_jsxs("div", { className: "bg-slate-800 rounded-xl p-4 animate-pulse", children: [_jsx("div", { className: "h-4 bg-slate-700 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-3 bg-slate-700 rounded w-1/2" })] }, i))) })) : bookings.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("span", { className: "text-2xl", children: "\uD83D\uDCC5" }) }), _jsx("h3", { className: "text-lg font-medium text-slate-300 mb-2", children: "No bookings today" }), _jsx("p", { className: "text-slate-500", children: "New reservations will appear here automatically." })] })) : (_jsx("div", { className: "space-y-3", children: bookings.map((booking) => (_jsx("div", { className: "bg-slate-800 rounded-xl p-4 hover:bg-slate-700/50 transition-colors", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h4", { className: "font-medium text-slate-200", children: booking.user.name || booking.user.email }), _jsxs("span", { className: "text-xs text-slate-400", children: ["Party of ", booking.partySize] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 text-sm text-slate-400", children: [_jsxs("span", { children: ["\uD83D\uDCC5 ", new Date(booking.slot.date).toLocaleDateString()] }), _jsxs("span", { children: ["\uD83D\uDD50 ", booking.slot.time] }), _jsxs("span", { children: ["\uD83D\uDCE7 ", booking.user.email] }), booking.user.phone && _jsxs("span", { children: ["\uD83D\uDCDE ", booking.user.phone] })] }), _jsxs("div", { className: "mt-2 text-xs text-slate-500", children: ["Booked ", new Date(booking.createdAt).toLocaleString()] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`, children: booking.status }), booking.status === "PENDING" && (_jsx("button", { onClick: () => onStatusChange(booking.id, "CONFIRMED"), className: "px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors", children: "Confirm" })), booking.status === "CONFIRMED" && (_jsx("button", { onClick: () => onStatusChange(booking.id, "SEATED"), className: "px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors", children: "Seat" })), booking.status === "SEATED" && (_jsx("button", { onClick: () => onStatusChange(booking.id, "COMPLETED"), className: "px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors", children: "Complete" }))] })] }) }, booking.id))) })) })] }));
};
