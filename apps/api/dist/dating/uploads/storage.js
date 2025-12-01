"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageClient = void 0;
exports.presignPhotoUpload = presignPhotoUpload;
exports.getPhotoUrl = getPhotoUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_2 = require("@aws-sdk/client-s3");
const crypto_1 = __importDefault(require("crypto"));
// Initialize S3 client for Replit Object Storage
const s3Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: process.env.REPLIT_OBJSTORE_URL,
    credentials: {
        accessKeyId: process.env.REPLIT_OBJSTORE_ACCESS_KEY_ID,
        secretAccessKey: process.env.REPLIT_OBJSTORE_SECRET_ACCESS_KEY,
    },
});
exports.storageClient = s3Client;
const BUCKET_NAME = 'replit-objstore-5d4a1c81-2e13-484c-92e0-96c3c7f4803f';
function extForContentType(ct) {
    if (ct === "image/jpeg")
        return "jpg";
    if (ct === "image/png")
        return "png";
    if (ct === "image/webp")
        return "webp";
    return "bin";
}
async function presignPhotoUpload(opts) {
    const nonce = crypto_1.default.randomBytes(8).toString("hex");
    const id = crypto_1.default.randomUUID();
    const ext = extForContentType(opts.contentType);
    const objectKey = `dating/photos/pending/${opts.userHint || "anon"}/${nonce}/${id}.${ext}`;
    // Create a presigned URL for uploading
    const command = new client_s3_2.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        ContentType: opts.contentType,
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
    return {
        objectKey,
        uploadUrl,
        contentType: opts.contentType
    };
}
async function getPhotoUrl(objectKey) {
    const command = new client_s3_2.GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
    });
    return await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
}
