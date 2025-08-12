"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const discover_1 = __importDefault(require("./routes/discover"));
const reservations_1 = __importDefault(require("./routes/reservations"));
const restaurants_1 = __importDefault(require("./routes/restaurants"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 8080;
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
// Health check endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Hogu API is running', status: 'healthy' });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/restaurants', restaurants_1.default);
app.use('/api/reservations', reservations_1.default);
app.use('/api/discover', discover_1.default);
// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
    const buildPath = path_1.default.join(__dirname, '../../web/dist');
    app.use(express_1.default.static(buildPath));
    // Catch all handler: send back React's index.html file for client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(buildPath, 'index.html'));
    });
}
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hogu API listening on http://0.0.0.0:${PORT}`);
});
