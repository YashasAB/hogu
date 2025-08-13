import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export default function PhotoCarousel({ photos, className = '' }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    if (!photos.length) {
        return (_jsx("div", { className: `aspect-[3/2] bg-gray-200 rounded-2xl flex items-center justify-center ${className}`, children: _jsx("span", { className: "text-muted", children: "No photos available" }) }));
    }
    const goToSlide = (index) => {
        setCurrentIndex(index);
    };
    const goToPrevious = () => {
        setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
    };
    const goToNext = () => {
        setCurrentIndex(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
    };
    return (_jsxs("div", { className: `relative aspect-[3/2] rounded-2xl overflow-hidden ${className}`, children: [_jsxs("div", { className: "relative w-full h-full", children: [_jsx("img", { src: photos[currentIndex].url, alt: photos[currentIndex].alt || `Photo ${currentIndex + 1}`, className: "w-full h-full object-cover", loading: "lazy" }), photos.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: goToPrevious, className: "absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity", "aria-label": "Previous photo", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }) }), _jsx("button", { onClick: goToNext, className: "absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity", "aria-label": "Next photo", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" }) }) })] }))] }), photos.length > 1 && (_jsx("div", { className: "absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2", children: photos.map((_, index) => (_jsx("button", { onClick: () => goToSlide(index), className: `w-3 h-3 rounded-full transition-all ${index === currentIndex
                        ? 'bg-white shadow-md'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-70'}`, "aria-label": `Go to photo ${index + 1}` }, index))) })), _jsxs("div", { className: "absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm", children: [currentIndex + 1, " / ", photos.length] })] }));
}
