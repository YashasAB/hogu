"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountImageRoutes = mountImageRoutes;
const multer_1 = __importDefault(require("multer"));
const storage_1 = require("@google-cloud/storage");
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const storageClient = new storage_1.Storage({
    credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
            url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
            format: {
                type: "json",
                subject_token_field_name: "access_token",
            },
        },
        universe_domain: "googleapis.com",
    },
    projectId: "",
});
function getBucketName() {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
        throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    }
    return bucketId;
}
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
function mountImageRoutes(app, prisma) {
    const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
    app.post('/api/upload', upload.single('image'), async (req, res) => {
        try {
            if (!req.file)
                return res.status(400).json({ error: 'No file uploaded' });
            const { restaurantId } = req.body;
            if (!restaurantId)
                return res.status(400).json({ error: 'Restaurant ID is required' });
            console.log('Starting upload process for restaurant:', restaurantId);
            const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
            if (!restaurant)
                return res.status(404).json({ error: 'Restaurant not found' });
            const bucketName = getBucketName();
            const bucket = storageClient.bucket(bucketName);
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const ext = req.file.originalname.split('.').pop() || 'jpg';
            const filename = `heroImage-${ts}.${ext}`;
            const key = `restaurants/${restaurantId}/${filename}`;
            console.log('Uploading to object storage with key:', key);
            const file = bucket.file(key);
            await file.save(req.file.buffer, {
                contentType: sniff(req.file.buffer, req.file.originalname),
            });
            console.log('Upload successful, updating database');
            const imageUrl = `/api/images/storage/${key}`;
            await prisma.restaurant.update({ where: { id: restaurantId }, data: { heroImageUrl: imageUrl } });
            console.log('Database updated with image URL:', imageUrl);
            return res.json({ success: true, url: imageUrl, heroImageUrl: imageUrl, filename });
        }
        catch (e) {
            console.error('Upload error:', e);
            return res.status(500).json({ error: 'Upload failed' });
        }
    });
    app.get('/api/images/storage/:path(*)', async (req, res) => {
        try {
            const filePath = req.params.path;
            if (!filePath)
                return res.status(400).json({ error: 'File path is required' });
            console.log(`Downloading image: ${filePath}`);
            const bucketName = getBucketName();
            const bucket = storageClient.bucket(bucketName);
            const file = bucket.file(filePath);
            const [exists] = await file.exists();
            if (!exists) {
                console.error(`Image not found: ${filePath}`);
                return res.status(404).json({ error: 'Image not found' });
            }
            const [metadata] = await file.getMetadata();
            const contentType = metadata.contentType || 'application/octet-stream';
            console.log(`Streaming image: ${filePath}`);
            res.set({
                'Content-Type': contentType,
                'Content-Length': metadata.size?.toString() || '',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
            });
            const stream = file.createReadStream();
            stream.on('error', (err) => {
                console.error('Stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error streaming file' });
                }
            });
            stream.pipe(res);
        }
        catch (e) {
            console.error('Image proxy error:', e);
            return res.status(500).json({ error: 'Failed to serve image' });
        }
    });
    app.head('/api/images/storage/:path(*)', async (req, res) => {
        try {
            const filePath = req.params.path;
            if (!filePath)
                return res.sendStatus(400);
            const bucketName = getBucketName();
            const bucket = storageClient.bucket(bucketName);
            const file = bucket.file(filePath);
            const [exists] = await file.exists();
            if (!exists)
                return res.sendStatus(404);
            const [metadata] = await file.getMetadata();
            res.set({
                'Content-Type': metadata.contentType || 'application/octet-stream',
                'Content-Length': metadata.size?.toString() || '',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
            });
            return res.sendStatus(200);
        }
        catch {
            return res.sendStatus(500);
        }
    });
}
