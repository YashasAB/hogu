import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
export default function AdminPhotos() {
    const { restaurantId } = useParams();
    const [photos, setPhotos] = useState([]);
    const [file, setFile] = useState(null);
    const [alt, setAlt] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [directUrl, setDirectUrl] = useState('');
    const load = async () => {
        const r = await fetch(`/api/restaurants/${restaurantId}/photos`);
        setPhotos(await r.json());
    };
    useEffect(() => { load(); }, [restaurantId]);
    const addViaUrl = async () => {
        if (!directUrl)
            return;
        const r = await fetch(`/api/restaurants/${restaurantId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: directUrl, alt, sort_order: sortOrder })
        });
        if (r.ok) {
            setDirectUrl('');
            setAlt('');
            setSortOrder(0);
            load();
        }
    };
    const uploadToS3 = async () => {
        if (!file)
            return;
        const pres = await fetch(`/api/restaurants/${restaurantId}/photos/presign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/jpeg' })
        });
        const p = await pres.json();
        if (!pres.ok) {
            alert(p.error || 'Presign failed');
            return;
        }
        const form = new FormData();
        Object.entries(p.fields).forEach(([k, v]) => form.append(k, v));
        form.append('Content-Type', file.type || 'image/jpeg');
        form.append('file', file);
        const upload = await fetch(p.url, { method: 'POST', body: form });
        if (upload.ok) {
            await fetch(`/api/restaurants/${restaurantId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: p.publicUrl, alt, sort_order: sortOrder })
            });
            setFile(null);
            setAlt('');
            setSortOrder(0);
            load();
        }
        else {
            alert('S3 upload failed');
        }
    };
    const saveAlt = async (id, newAlt, newOrder) => {
        await fetch(`/api/restaurants/${restaurantId}/photos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alt: newAlt, sort_order: newOrder })
        });
        load();
    };
    const del = async (id) => {
        await fetch(`/api/restaurants/${restaurantId}/photos/${id}`, { method: 'DELETE' });
        load();
    };
    return (_jsxs("div", { className: "space-y-4 max-w-2xl", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Photos" }), _jsxs("div", { className: "card space-y-2", children: [_jsx("h2", { className: "font-medium", children: "Add via URL (dev)" }), _jsx("input", { className: "input", placeholder: "Image URL", value: directUrl, onChange: e => setDirectUrl(e.target.value) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { className: "input", placeholder: "Alt text", value: alt, onChange: e => setAlt(e.target.value) }), _jsx("input", { className: "input w-24", type: "number", value: sortOrder, onChange: e => setSortOrder(parseInt(e.target.value || '0')) }), _jsx("button", { className: "btn btn-primary", onClick: addViaUrl, children: "Add" })] })] }), _jsxs("div", { className: "card space-y-2", children: [_jsx("h2", { className: "font-medium", children: "Upload to S3 (prod)" }), _jsx("input", { type: "file", accept: "image/*", onChange: e => setFile(e.target.files?.[0] || null) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { className: "input", placeholder: "Alt text", value: alt, onChange: e => setAlt(e.target.value) }), _jsx("input", { className: "input w-24", type: "number", value: sortOrder, onChange: e => setSortOrder(parseInt(e.target.value || '0')) }), _jsx("button", { className: "btn btn-primary", onClick: uploadToS3, children: "Upload" })] }), _jsxs("p", { className: "text-muted text-sm", children: ["Configure S3 in ", _jsx("code", { children: "apps/api/.env" }), " for presign to work."] })] }), _jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: photos.map(p => (_jsxs("div", { className: "card space-y-2", children: [_jsx("img", { src: p.url, className: "w-full h-40 object-cover rounded-2xl" }), _jsx("input", { className: "input", defaultValue: p.alt || '', onBlur: e => saveAlt(p.id, e.target.value, p.sortOrder) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { className: "input w-24", type: "number", defaultValue: p.sortOrder, onBlur: e => saveAlt(p.id, p.alt || '', parseInt(e.target.value || '0')) }), _jsx("button", { className: "btn", onClick: () => del(p.id), children: "Delete" })] })] }, p.id))) })] }));
}
