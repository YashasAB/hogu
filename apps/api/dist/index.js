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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./routes/auth"));
const discover_1 = __importDefault(require("./routes/discover"));
const restaurants_1 = __importDefault(require("./routes/restaurants"));
const reservations_1 = __importDefault(require("./routes/reservations"));
const admin_1 = __importDefault(require("./routes/admin"));
const prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
// Test database connection on startup
async function testDatabaseConnection() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}
testDatabaseConnection();
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 8080;
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 8080);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
// Set DATABASE_URL if not present (for deployment)
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
}
// ---- Health routes FIRST, before anything heavy ----
app.get('/health', (_req, res) => res.status(200).json({ status: 'healthy' }));
app.get('/ready', (_req, res) => res.status(200).json({ status: 'ready' }));
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
// Serve static files from React build in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    const webDistPath = path_1.default.join(__dirname, '../../web/dist');
    app.use(express_1.default.static(webDistPath));
    console.log('Serving static files from:', webDistPath);
}
// Additional health check with database test (after server is listening)
app.get('/health/db', async (req, res) => {
    try {
        // Test database connection
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'ok',
            database: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Database health check failed:', error);
        res.status(503).json({
            status: 'error',
            database: 'disconnected',
            error: 'Database connection failed',
            timestamp: new Date().toISOString()
        });
    }
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/restaurants', restaurants_1.default);
app.use('/api/reservations', reservations_1.default);
app.use('/api/discover', discover_1.default);
app.use('/api/admin', admin_1.default);
// In production, serve the React app for all non-API routes
if (isProduction) {
    app.get(/^\/(?!api\/).*/, (_req, res) => {
        const webDistPath = path_1.default.join(__dirname, '../../web/dist');
        res.sendFile(path_1.default.join(webDistPath, 'index.html'));
    });
}
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Hogu API listening on http://0.0.0.0:${PORT}`);
});
// 🔑 Mount everything heavy AFTER we're listening
server.on('listening', async () => {
    try {
        // Lazy-import the file that mounts image routes
        const { mountImageRoutes } = await Promise.resolve().then(() => __importStar(require('./mount-images')));
        mountImageRoutes(app, prisma);
        console.log('✅ Image routes mounted');
    }
    catch (e) {
        console.error('⚠️ Failed to mount image routes (continuing):', e);
    }
});
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});
