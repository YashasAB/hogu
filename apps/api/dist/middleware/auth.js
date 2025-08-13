"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateRestaurant = void 0;
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const authenticateRestaurant = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            console.log('Restaurant auth: No token provided');
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('Restaurant auth: Decoded restaurant ID:', decoded.restaurantId);
        req.restaurantId = decoded.restaurantId;
        next();
    }
    catch (error) {
        console.log('Restaurant auth: Token verification failed:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticateRestaurant = authenticateRestaurant;
function authenticateToken(req, res, next) {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('JWT verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
}
