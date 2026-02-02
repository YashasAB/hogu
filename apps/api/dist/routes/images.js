"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storage_1 = require("../dating/uploads/storage");
const router = (0, express_1.Router)();
router.get('/storage/*', async (req, res) => {
    try {
        const filePath = req.params[0];
        if (!filePath) {
            console.log('No file path provided');
            return res.status(400).json({ error: 'File path is required' });
        }
        console.log(`Downloading image: ${filePath}`);
        const result = await (0, storage_1.getPhotoStream)(filePath);
        if (!result) {
            console.error(`Image not found: ${filePath}`);
            return res.status(404).json({ error: 'Image not found' });
        }
        console.log(`Successfully streaming image: ${filePath}`);
        res.set({
            "Content-Type": result.contentType,
            "Content-Length": result.size?.toString() || '',
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*",
        });
        result.stream.on('error', (err) => {
            console.error('Stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file' });
            }
        });
        result.stream.pipe(res);
    }
    catch (error) {
        console.error('Error downloading image:', error);
        res.status(500).json({ error: 'Failed to download image' });
    }
});
exports.default = router;
