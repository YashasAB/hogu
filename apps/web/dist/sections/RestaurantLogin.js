import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
export default function RestaurantLogin() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('/api/auth/restaurant-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error || 'Login failed');
                return;
            }
            localStorage.setItem('hogu_restaurant_token', data.token);
            // Redirect to restaurant dashboard
            navigate(`/admin/${data.restaurantId}`);
        }
        catch (error) {
            console.error('Restaurant login error:', error);
            alert('Login failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-brand rounded-2xl flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" }) }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Restaurant Portal" }), _jsx("p", { className: "text-gray-600", children: "Access your Hogu restaurant dashboard" })] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 space-y-6", children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Restaurant Username" }), _jsx("input", { type: "text", name: "username", placeholder: "Restaurant username", value: formData.username, onChange: handleInputChange, className: "input", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }), _jsx("input", { type: "password", name: "password", className: "input", value: formData.password, onChange: handleInputChange, placeholder: "Your password", required: true })] }), _jsx("button", { type: "submit", disabled: loading, className: "btn btn-primary w-full py-3 text-lg font-semibold", children: loading ? 'Signing in...' : 'Sign In to Dashboard' })] }), _jsx("div", { className: "text-center pt-4 border-t border-gray-100", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["Need help accessing your account?", ' ', _jsx("a", { href: "mailto:support@hogu.com", className: "text-brand hover:underline font-medium", children: "Contact Support" })] }) })] }), _jsxs("div", { className: "bg-white rounded-xl p-6 border border-gray-200", children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "Available Restaurant Accounts" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Use any of these restaurant usernames with password \"restaurant123\":" }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg space-y-2 max-h-48 overflow-y-auto", children: [_jsx("div", { className: "text-xs text-gray-500 mb-2", children: "Username | Password" }), _jsxs("div", { className: "space-y-1 text-sm font-mono", children: [_jsx("div", { className: "text-gray-700", children: "zlb-23-at-the-leela-palace | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "soka | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "bar-spirit-forward | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "naru-noodle-bar | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "pizza-4ps-indiranagar | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "dali-and-gala | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "the-permit-room | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "toit-brewpub | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "byg-brewski-brewing-company | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "truffles | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "glen-s-bakehouse | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "koshy-s | restaurant123" }), _jsx("div", { className: "text-gray-700", children: "vidyarthi-bhavan | restaurant123" })] })] })] }), _jsx("div", { className: "text-center", children: _jsxs("a", { href: "/", className: "text-brand hover:underline font-medium inline-flex items-center gap-2", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 19l-7-7m0 0l7-7m-7 7h18" }) }), "Back to Customer Site"] }) })] }) }));
}
