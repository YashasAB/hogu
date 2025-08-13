import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
export default function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError('');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Login failed');
                return;
            }
            // Store the token
            localStorage.setItem('hogu_token', data.token);
            // Redirect to home or previous page
            navigate('/');
        }
        catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "mx-auto w-16 h-16 bg-brand rounded-2xl flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13 3L18.5 8.5C18.1 8.8 17.6 9 17 9H7C6.4 9 5.9 8.8 5.5 8.5L11 3L9 1L3 7V9C3 10.1 3.9 11 5 11V16C5 17.1 5.9 18 7 18H9C10.1 18 11 17.1 11 16V13H13V16C13 17.1 13.9 18 15 18H17C18.1 18 19 17.1 19 16V11C20.1 11 21 10.1 21 9Z" }) }) }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Sign In" }), _jsx("p", { className: "text-gray-600", children: "Welcome back to Hogu" })] }), _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 space-y-6", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsx("p", { className: "text-red-800 text-sm", children: error }) })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Username" }), _jsx("input", { type: "text", name: "username", className: "input", value: formData.username, onChange: handleChange, placeholder: "Your username", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }), _jsx("input", { type: "password", name: "password", className: "input", value: formData.password, onChange: handleChange, placeholder: "Your password", required: true })] }), _jsx("button", { type: "submit", disabled: loading, className: "btn btn-primary w-full py-3 text-lg font-semibold", children: loading ? 'Signing in...' : 'Sign In' })] }), _jsx("div", { className: "text-center pt-4 border-t border-gray-100", children: _jsxs("p", { className: "text-sm text-gray-600", children: ["Don't have an account?", ' ', _jsx(Link, { to: "/signup", className: "text-brand hover:underline font-medium", children: "Create Account" })] }) }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Demo Account" }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Use these credentials to test:" }), _jsxs("div", { className: "text-sm font-mono text-gray-700", children: [_jsx("div", { children: "Username: johndoe" }), _jsx("div", { children: "Password: user123" })] })] })] })] }) }));
}
