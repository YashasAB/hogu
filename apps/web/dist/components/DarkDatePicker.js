import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
/**
 * Dark, mobile-friendly date picker built with react-day-picker.
 * - Warm red accents to match your theme
 * - Dropdown popover on desktop, full-screen sheet on mobile
 * - Emits YYYY-MM-DD strings (local) to match your filters/API
 */
// Utils
function toYMD(d) {
    if (!d)
        return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function fromYMD(s) {
    if (!s)
        return undefined;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d)
        return undefined;
    return new Date(y, m - 1, d);
}
export default function DarkDatePicker({ value, onChange, min, max, label = "Date" }) {
    const [open, setOpen] = useState(false);
    const [internal, setInternal] = useState(() => fromYMD(value));
    const triggerRef = useRef(null);
    const popRef = useRef(null);
    useEffect(() => { setInternal(fromYMD(value)); }, [value]);
    // close on click outside (desktop popover)
    useEffect(() => {
        if (!open)
            return;
        function onDocClick(e) {
            const t = e.target;
            if (popRef.current?.contains(t) || triggerRef.current?.contains(t))
                return;
            setOpen(false);
        }
        function onKey(e) { if (e.key === "Escape")
            setOpen(false); }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
    }, [open]);
    const selected = internal;
    const disabled = useMemo(() => {
        const dis = [];
        if (min)
            dis.push({ before: min });
        if (max)
            dis.push({ after: max });
        return dis;
    }, [min, max]);
    function commit(d) {
        setInternal(d);
        setOpen(false);
        if (onChange)
            onChange(toYMD(d));
    }
    return (_jsxs("div", { className: "w-full", children: [label && _jsx("label", { className: "block text-xs font-medium text-slate-300 mb-1", children: label }), _jsxs("button", { ref: triggerRef, type: "button", onClick: () => setOpen(true), className: "h-12 w-full rounded-xl bg-slate-800 border border-white/10 px-3 text-left text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 flex items-center justify-between", children: [selected ? (_jsx("span", { className: "font-medium", children: toYMD(selected) })) : (_jsx("span", { className: "text-slate-400", children: "Select date" })), _jsx("svg", { className: "w-4 h-4 text-slate-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) })] }), open && (_jsx("div", { className: "hidden md:block relative z-50", children: _jsx("div", { ref: popRef, className: "absolute mt-2 right-0 md:right-auto md:left-0 w-[320px] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl", children: _jsx(CalendarPanel, { selected: selected, onSelect: commit, min: min, max: max }) }) })), open && (_jsx("div", { className: "md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm", children: _jsxs("div", { className: "absolute inset-x-0 bottom-0 rounded-t-2xl bg-slate-900 ring-1 ring-white/10 p-3 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between px-1 pb-2", children: [_jsx("button", { className: "px-3 h-10 rounded-lg text-slate-300", onClick: () => setOpen(false), children: "Cancel" }), _jsx("div", { className: "text-sm text-slate-300", children: "Pick a date" }), _jsx("button", { className: "px-3 h-10 rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 text-slate-900 font-semibold", onClick: () => commit(selected), children: "Done" })] }), _jsx("div", { className: "rounded-xl overflow-hidden ring-1 ring-white/10", children: _jsx(CalendarPanel, { selected: selected, onSelect: setInternal, min: min, max: max }) })] }) }))] }));
}
function CalendarPanel({ selected, onSelect, min, max }) {
    return (_jsxs("div", { className: "rdp-root bg-slate-900 text-slate-100", children: [_jsx(DayPicker, { mode: "single", selected: selected, onSelect: onSelect, captionLayout: "dropdown", fromYear: new Date().getFullYear() - 1, toYear: new Date().getFullYear() + 2, showOutsideDays: true, fixedWeeks: true, disabled: [
                    ...(min ? [{ before: min }] : []),
                    ...(max ? [{ after: max }] : []),
                ] }), _jsx("style", { children: `
        .rdp-root .rdp { 
          --rdp-cell-size: 46px; 
          --rdp-caption-font-size: 14px; 
          --rdp-accent-color: #f43f5e; /* rose-500 */
          --rdp-accent-color-dark: #e11d48; /* darker rose */
          --rdp-background-color: #0f172a; 
          --rdp-background-color-dark: #0b1220; 
          --rdp-outline: 2px solid rgba(244,63,94,.35);
          --rdp-outline-selected: 2px solid rgba(245,158,11,.55);
        }
        .rdp-root .rdp {
          background: #0f172a; /* slate-900 */
          color: #e5e7eb;
        }
        .rdp-root .rdp-button[aria-selected="true"] { color: #0b1220; }
        .rdp-root .rdp-head_cell {
          color: #64748b; /* slate-500 */
          font-weight: 500;
          font-size: 12px;
        }
        .rdp-root .rdp-button {
          border-radius: 8px;
        }
        .rdp-root .rdp-button:hover:not([aria-selected="true"]) {
          background-color: #1e293b; /* slate-800 */
        }
        .rdp-root .rdp-button[disabled] {
          color: #475569; /* slate-600 */
          opacity: 0.5;
        }
      ` })] }));
}
