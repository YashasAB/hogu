import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export default function AvailabilityGrid({ restaurantId, date, partySize, onSlotSelect }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchSlots = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/restaurants/${restaurantId}/availability?date=${date}&partySize=${partySize}`);
                if (response.ok) {
                    const data = await response.json();
                    setSlots(data);
                }
            }
            catch (error) {
                console.error('Failed to fetch availability:', error);
            }
            finally {
                setLoading(false);
            }
        };
        if (restaurantId && date && partySize) {
            fetchSlots();
        }
    }, [restaurantId, date, partySize]);
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-medium", children: "Available Times" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: [...Array(6)].map((_, i) => (_jsx("div", { className: "h-10 bg-gray-200 rounded-xl animate-pulse" }, i))) })] }));
    }
    if (!slots.length) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-medium", children: "Available Times" }), _jsx("p", { className: "text-muted", children: "No availability for this date and party size." })] }));
    }
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "font-medium", children: "Available Times" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: slots.map((slot) => (_jsx("button", { onClick: () => slot.status === 'AVAILABLE' ? onSlotSelect(slot.slotId) : undefined, className: `pill text-center py-3 transition-all ${slot.status === 'AVAILABLE'
                        ? 'pill-available'
                        : slot.status === 'FULL'
                            ? 'pill-full'
                            : 'pill-cutoff'}`, disabled: slot.status !== 'AVAILABLE', children: formatTime(slot.time) }, slot.slotId))) }), slots.some(s => s.status === 'CUTOFF') && (_jsx("p", { className: "text-sm text-muted", children: "Some times are past the booking cutoff window" }))] }));
}
