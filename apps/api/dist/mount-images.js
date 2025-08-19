"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountImageRoutes = mountImageRoutes;
const multer_1 = __importDefault(require("multer"));
function mountImageRoutes(app, prisma) {
    const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
    const toBuf = (v) => {
        if (Buffer.isBuffer(v))
            return v;
        if (v instanceof Uint8Array)
            return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
        if (Array.isArray(v) && v.length) {
            const first = v[0];
            if (Buffer.isBuffer(first))
                return first;
            if (first instanceof Uint8Array)
                return Buffer.from(first.buffer, first.byteOffset, first.byteLength);
        }
        throw new Error('Unexpected storage value type');
    };
    const sniff = (buf, filename) => {
        const sig = buf.subarray(0, 4).toString('hex');
        if (sig.startsWith('ffd8'))
            return 'image/jpeg';
        if (sig === '89504e47')
            return 'image/png';
        if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP')
            return 'image/webp';
        if (sig.startsWith('4749'))
            return 'image/gif';
        if (filename.toLowerCase().endsWith('.svg'))
            return 'image/svg+xml';
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg')
            return 'image/jpeg';
        if (ext === 'png')
            return 'image/png';
        if (ext === 'gif')
            return 'image/gif';
        if (ext === 'webp')
            return 'image/webp';
        return 'application/octet-stream';
    };
    // ---- UPLOAD ----
    app.post('/api/upload', upload.single('image'), async (req, res) => {
        try {
            if (!req.file)
                return res.status(400).json({ error: 'No file uploaded' });
            const { restaurantId } = req.body;
            if (!restaurantId)
                return res.status(400).json({ error: 'Restaurant ID is required' });
            console.log('📤 Starting upload process for restaurant:', restaurantId);
            // Validate restaurant exists
            const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
            if (!restaurant)
                return res.status(404).json({ error: 'Restaurant not found' });
            // Lazy-create client only when needed
            const { Client } = await Promise.resolve().then(() => __importStar(require('@replit/object-storage')));
            const storage = new Client();
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const ext = req.file.originalname.split('.').pop() || 'jpg';
            const filename = `heroImage-${ts}.${ext}`;
            const key = `${restaurantId}/${filename}`;
            console.log('📁 Uploading to object storage with key:', key);
            const put = await storage.uploadFromBytes(key, req.file.buffer, { compress: false });
            if (!put.ok)
                return res.status(500).json({ error: 'Upload failed', details: put.error });
            console.log('✅ Upload successful, updating database');
            // Persist URL in DB (served via your proxy)
            const imageUrl = `/api/images/storage/${key}`;
            await prisma.restaurant.update({ where: { id: restaurantId }, data: { heroImageUrl: imageUrl } });
            console.log('✅ Database updated with image URL:', imageUrl);
            return res.json({ success: true, url: imageUrl, heroImageUrl: imageUrl, filename });
        }
        catch (e) {
            console.error('Upload error:', e);
            return res.status(500).json({ error: 'Upload failed' });
        }
    });
    // ---- DOWNLOAD ----
    app.get('/api/images/storage/:tenantId/:filename', async (req, res) => {
        try {
            const { tenantId, filename } = req.params;
            const key = `${tenantId}/${filename}`;
            console.log(`📁 Downloading image from storage: ${key}`);
            const { Client } = await Promise.resolve().then(() => __importStar(require('@replit/object-storage'))); // lazy
            const storage = new Client();
            const out = await storage.downloadAsBytes(key);
            if (!out?.ok || !out?.value) {
                console.error(`❌ Failed to download image: ${key}`, out?.error);
                return res.status(404).json({ error: 'Image not found', key });
            }
            console.log(`✅ Successfully downloaded image: ${key}`);
            const buf = toBuf(out.value);
            const ct = sniff(buf, filename);
            // Set precise headers (no charset on images)
            res.setHeader('Content-Type', ct);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Length', String(buf.length));
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            return res.end(buf);
        }
        catch (e) {
            console.error('Image proxy error:', e);
            return res.status(500).json({ error: 'Failed to serve image' });
        }
    });
    // Optional HEAD for probes/CDNs
    app.head('/api/images/storage/:tenantId/:filename', async (req, res) => {
        try {
            const { tenantId, filename } = req.params;
            const key = `${tenantId}/${filename}`;
            const { Client } = await Promise.resolve().then(() => __importStar(require('@replit/object-storage')));
            const storage = new Client();
            const out = await storage.downloadAsBytes(key);
            if (!out?.ok || !out?.value)
                return res.sendStatus(404);
            const buf = toBuf(out.value);
            const ct = sniff(buf, filename);
            res.setHeader('Content-Type', ct);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Length', String(buf.length));
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            return res.sendStatus(200);
        }
        catch {
            return res.sendStatus(500);
        }
    });
}
