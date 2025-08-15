import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useParams } from 'react-router-dom';
export default function AdminProfile() {
    const { restaurantId } = useParams();
    const [name, setName] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [instagram, setInstagram] = useState('');
    const [hero, setHero] = useState('');
    const save = async () => {
        const r = await fetch(`/api/restaurants/${restaurantId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, neighborhood, instagram_url: instagram, hero_image_url: hero })
        });
        const d = await r.json();
        alert(r.ok ? 'Saved' : (d.error || 'Error'));
    };
    return (_jsxs("div", { className: "max-w-xl space-y-3", children: [_jsx("h1", { className: "text-2xl font-semibold", children: "Restaurant Profile" }), _jsx("input", { className: "input", placeholder: "Name", value: name, onChange: e => setName(e.target.value) }), _jsx("input", { className: "input", placeholder: "Neighborhood", value: neighborhood, onChange: e => setNeighborhood(e.target.value) }), _jsx("input", { className: "input", placeholder: "Instagram URL", value: instagram, onChange: e => setInstagram(e.target.value) }), _jsx("input", { className: "input", placeholder: "Hero image URL", value: hero, onChange: e => setHero(e.target.value) }), _jsx("button", { className: "btn btn-primary", onClick: save, children: "Save" }), _jsx("p", { className: "text-muted text-sm", children: "Demo-only page (no auth). In prod, gate via RBAC." })] }));
}
