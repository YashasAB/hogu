import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export default function Profile() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        const token = localStorage.getItem('hogu_token');
        if (!token) {
            navigate('/login');
            return;
        }
        const fetchReservations = async () => {
            try {
                const response = await fetch('/api/reservations', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setReservations(data);
                }
            }
            catch (error) {
                console.error('Failed to fetch reservations:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchReservations();
    }, [navigate]);
    const handleLogout = () => {
        localStorage.removeItem('hogu_token');
        navigate('/');
    };
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return 'pill bg-orange-100 text-orange-800';
            case 'CONFIRMED':
                return 'pill bg-green-100 text-green-800';
            case 'HELD':
                return 'pill bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'pill bg-red-100 text-red-800';
            case 'SEATED':
                return 'pill bg-blue-100 text-blue-800';
            case 'NO_SHOW':
                return 'pill bg-gray-100 text-gray-800';
            default:
                return 'pill bg-gray-100 text-gray-800';
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "My Profile" }), _jsx("button", { onClick: handleLogout, className: "btn btn-secondary", children: "Sign Out" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("button", { onClick: () => navigate('/drops'), className: "card text-left hover:shadow-lg transition-shadow", children: [_jsx("h3", { className: "font-medium mb-1", children: "Drops" }), _jsx("p", { className: "text-muted text-sm", children: "Join reservation drops" })] }), _jsxs("button", { onClick: () => navigate('/waitlist'), className: "card text-left hover:shadow-lg transition-shadow", children: [_jsx("h3", { className: "font-medium mb-1", children: "Waitlist" }), _jsx("p", { className: "text-muted text-sm", children: "Manage your waitlist" })] }), _jsxs("button", { onClick: () => navigate('/'), className: "card text-left hover:shadow-lg transition-shadow", children: [_jsx("h3", { className: "font-medium mb-1", children: "Discover" }), _jsx("p", { className: "text-muted text-sm", children: "Find new restaurants" })] })] }), _jsxs("div", { className: "card space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "My Reservations" }), loading ? (_jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => (_jsxs("div", { className: "border border-gray-200 rounded-xl p-4 animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/2" })] }, i))) })) : reservations.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-muted mb-4", children: "No reservations yet" }), _jsx("button", { onClick: () => navigate('/'), className: "btn btn-primary", children: "Make Your First Reservation" })] })) : (_jsx("div", { className: "space-y-3", children: reservations.map((reservation) => (_jsxs("div", { className: "border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium", children: reservation.restaurant.name }), _jsx("span", { className: getStatusColor(reservation.status), children: reservation.status })] }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-muted", children: [_jsx("span", { children: formatDate(reservation.slot.date) }), _jsx("span", { children: formatTime(reservation.slot.time) }), _jsxs("span", { children: [reservation.partySize, " ", reservation.partySize === 1 ? 'person' : 'people'] })] }), reservation.status === 'HELD' && (_jsx("div", { className: "mt-3", children: _jsx("button", { onClick: () => navigate(`/r/${reservation.restaurant.slug}/hold/${reservation.id}`), className: "btn btn-primary btn-sm", children: "Complete Booking" }) }))] }, reservation.id))) }))] })] }));
}
