"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageClient = void 0;
exports.presignPhotoUpload = presignPhotoUpload;
exports.getPhotoUrl = getPhotoUrl;
exports.getPhotoStream = getPhotoStream;
const storage_1 = require("@google-cloud/storage");
const crypto_1 = __importDefault(require("crypto"));
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
exports.storageClient = storageClient;
function getBucketName() {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
        throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    }
    return bucketId;
}
function extForContentType(ct) {
    if (ct === "image/jpeg")
        return "jpg";
    if (ct === "image/png")
        return "png";
    if (ct === "image/webp")
        return "webp";
    return "bin";
}
async function signObjectURL({ bucketName, objectName, method, ttlSec, }) {
    const request = {
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        throw new Error(`Failed to sign object URL, errorcode: ${response.status}`);
    }
    const data = await response.json();
    return data.signed_url;
}
async function presignPhotoUpload(opts) {
    const bucketName = getBucketName();
    const nonce = crypto_1.default.randomBytes(8).toString("hex");
    const id = crypto_1.default.randomUUID();
    const ext = extForContentType(opts.contentType);
    const objectKey = `dating/photos/pending/${opts.userHint || "anon"}/${nonce}/${id}.${ext}`;
    const uploadUrl = await signObjectURL({
        bucketName,
        objectName: objectKey,
        method: "PUT",
        ttlSec: 3600,
    });
    return {
        objectKey,
        uploadUrl,
        contentType: opts.contentType
    };
}
async function getPhotoUrl(objectKey) {
    const bucketName = getBucketName();
    return await signObjectURL({
        bucketName,
        objectName: objectKey,
        method: "GET",
        ttlSec: 3600,
    });
}
async function getPhotoStream(objectKey) {
    const bucketName = getBucketName();
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectKey);
    const [exists] = await file.exists();
    if (!exists) {
        return null;
    }
    const [metadata] = await file.getMetadata();
    return {
        stream: file.createReadStream(),
        contentType: metadata.contentType || 'application/octet-stream',
        size: metadata.size,
    };
}
