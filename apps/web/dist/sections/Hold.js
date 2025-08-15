import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
export default function Hold() {
    const { reservationId } = useParams();
    const navigate = useNavigate();
    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    useEffect(() => {
        const fetchReservation = async () => {
            if (!reservationId)
                return;
            try {
                const response = await fetch(`/api/reservations/${reservationId}`);
                if (response.ok) {
                    const data = await response.json();
                    setReservation(data);
                }
            }
            catch (error) {
                console.error('Failed to fetch reservation:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchReservation();
    }, [reservationId]);
    useEffect(() => {
        if (!reservation?.holdExpiresAt)
            return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expires = new Date(reservation.holdExpiresAt).getTime();
            const diff = expires - now;
            if (diff <= 0) {
                setTimeLeft(0);
                navigate(`/r/${reservation.restaurant.slug}`);
            }
            else {
                setTimeLeft(Math.ceil(diff / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [reservation, navigate]);
    const handleConfirm = async () => {
        if (!reservationId)
            return;
        setConfirming(true);
        try {
            const response = await fetch(`/api/reservations/${reservationId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Confirmation failed');
                return;
            }
            // Success - show confirmation page
            alert('Reservation confirmed! Check your email for details.');
            navigate('/me');
        }
        catch (error) {
            console.error('Failed to confirm reservation:', error);
            alert('Failed to confirm reservation');
        }
        finally {
            setConfirming(false);
        }
    };
    const handleCancel = async () => {
        if (!reservationId || !confirm('Are you sure you want to cancel this hold?'))
            return;
        try {
            const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
                method: 'POST'
            });
            if (response.ok) {
                navigate(`/r/${reservation?.restaurant.slug}`);
            }
        }
        catch (error) {
            console.error('Failed to cancel reservation:', error);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "card animate-pulse", children: [_jsx("div", { className: "h-6 bg-gray-200 rounded mb-4" }), _jsx("div", { className: "h-4 bg-gray-200 rounded mb-2" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-2/3" })] }) }));
    }
    if (!reservation) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("h1", { className: "text-2xl font-semibold mb-2", children: "Reservation not found" }), _jsx("p", { className: "text-muted", children: "This reservation may have expired or been cancelled." })] }));
    }
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    const formatCountdown = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "card text-center", children: [_jsx("div", { className: "text-accent text-4xl font-bold mb-2", children: formatCountdown(timeLeft) }), _jsx("p", { className: "text-muted", children: "Time remaining to confirm your reservation" })] }), _jsxs("div", { className: "card space-y-4", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Hold Confirmation" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between py-3 border-b border-gray-100", children: [_jsx("span", { className: "font-medium", children: "Restaurant" }), _jsx("span", { children: reservation.restaurant.name })] }), _jsxs("div", { className: "flex justify-between py-3 border-b border-gray-100", children: [_jsx("span", { className: "font-medium", children: "Date" }), _jsx("span", { children: formatDate(reservation.slot.date) })] }), _jsxs("div", { className: "flex justify-between py-3 border-b border-gray-100", children: [_jsx("span", { className: "font-medium", children: "Time" }), _jsx("span", { children: formatTime(reservation.slot.time) })] }), _jsxs("div", { className: "flex justify-between py-3 border-b border-gray-100", children: [_jsx("span", { className: "font-medium", children: "Party Size" }), _jsxs("span", { children: [reservation.partySize, " ", reservation.partySize === 1 ? 'person' : 'people'] })] })] })] }), _jsxs("div", { className: "card space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Payment Information" }), _jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-xl p-4", children: _jsx("p", { className: "text-blue-800 text-sm", children: "No deposit required for this reservation. You'll pay at the restaurant." }) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { onClick: handleConfirm, disabled: confirming || timeLeft <= 0, className: "btn btn-primary w-full py-4 text-lg", children: confirming ? 'Confirming...' : 'Confirm Reservation' }), _jsx("button", { onClick: handleCancel, className: "btn btn-secondary w-full py-3", children: "Cancel Hold" })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { className: "font-medium mb-2", children: "Reservation Terms" }), _jsxs("ul", { className: "text-sm text-muted space-y-1", children: [_jsx("li", { children: "\u2022 Please arrive within 15 minutes of your reservation time" }), _jsx("li", { children: "\u2022 Cancellations must be made at least 2 hours in advance" }), _jsx("li", { children: "\u2022 No-show fees may apply for missed reservations" }), _jsx("li", { children: "\u2022 Contact the restaurant directly for special requests" })] })] })] }));
}
