import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
export const RestaurantProfile = ({ restaurant, profileData, loading, onDataChange, onSave, }) => {
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [freshUploadedImageUrl, setFreshUploadedImageUrl] = useState(null);
    const handlePhotoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("restaurantId", restaurant.id);
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }
            const result = await response.json();
            const newImageUrl = result.url || result.heroImageUrl;
            setFreshUploadedImageUrl(newImageUrl);
            // Auto-update the heroImageUrl field so it gets saved
            onDataChange({ heroImageUrl: newImageUrl });
            console.log("✅ Image uploaded and database updated:", newImageUrl);
        }
        catch (error) {
            console.error("Error uploading photo:", error);
            alert(`Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        finally {
            setUploadingPhoto(false);
        }
    };
    return (_jsxs("section", { className: "rounded-2xl p-6 ring-1 ring-white/10 bg-slate-900/70", children: [_jsx("h2", { className: "text-lg sm:text-xl font-semibold mb-6", children: "Restaurant Profile" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Restaurant Name" }), _jsx("input", { type: "text", value: profileData.name, onChange: (e) => onDataChange({ name: e.target.value }), className: "w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500", placeholder: "Enter restaurant name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Neighborhood" }), _jsx("input", { type: "text", value: profileData.neighborhood, onChange: (e) => onDataChange({ neighborhood: e.target.value }), className: "w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500", placeholder: "Enter neighborhood" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Instagram URL" }), _jsx("input", { type: "url", value: profileData.instagramUrl, onChange: (e) => onDataChange({ instagramUrl: e.target.value }), className: "w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500", placeholder: "https://instagram.com/yourrestaurant" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Website URL" }), _jsx("input", { type: "url", value: profileData.website, onChange: (e) => onDataChange({ website: e.target.value }), className: "w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500", placeholder: "https://yourrestaurant.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-300 mb-2", children: "Hero Image" }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "relative bg-slate-800 rounded-lg border border-slate-600 p-2", children: profileData.heroImageUrl ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "text-xs text-yellow-400 mb-2", children: ["Image URL: ", profileData.heroImageUrl] }), _jsx("p", { className: "text-sm text-green-400 mt-2", children: "\u2705 Current hero image" }), _jsx("img", { src: profileData.heroImageUrl, alt: "Current hero image", className: "w-full max-w-md h-48 object-cover rounded-lg border border-slate-600" })] })) : (_jsx("div", { className: "w-full max-w-md h-48 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center text-slate-400", children: _jsxs("div", { className: "text-center", children: [_jsx("svg", { className: "w-12 h-12 mx-auto mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1, d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" }) }), _jsx("p", { className: "text-sm", children: "No image uploaded" })] }) })) }), freshUploadedImageUrl && (_jsxs(_Fragment, { children: [_jsx("img", { src: freshUploadedImageUrl, className: "w-full max-w-md h-48 object-cover rounded-lg border border-slate-600" }), _jsx("p", { className: "text-sm text-green-400 mt-2", children: "\u2705 New hero image" })] }))] }), _jsxs("div", { className: "mb-4", children: [_jsx("input", { type: "file", accept: "image/*", onChange: handlePhotoUpload, disabled: uploadingPhoto, className: "block w-full text-sm text-slate-300\n                         file:mr-4 file:py-2 file:px-4\n                         file:rounded-lg file:border-0\n                         file:text-sm file:font-medium\n                         file:bg-rose-600 file:text-white\n                         hover:file:bg-rose-700\n                         file:disabled:opacity-50 file:disabled:cursor-not-allowed" }), uploadingPhoto && (_jsx("p", { className: "text-sm text-slate-400 mt-2", children: "Uploading photo..." })), freshUploadedImageUrl && (_jsx("p", { className: "text-sm text-green-400 mt-2", children: "\u2713 Hero image is set. The image will appear on the restaurant detail page." }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-400 mb-2", children: "Or enter image URL manually:" }), _jsx("input", { type: "url", value: profileData.heroImageUrl, onChange: (e) => onDataChange({ heroImageUrl: e.target.value }), className: "w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500", placeholder: "https://example.com/hero-image.jpg" })] })] }), _jsx("button", { onClick: onSave, disabled: loading, className: "w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? "Saving..." : "Save Changes" })] })] }));
};
