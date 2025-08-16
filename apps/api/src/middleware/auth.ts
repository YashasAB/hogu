import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends Request {
  restaurantId?: string;
  user?: { userId: string; username: string; role?: string };
}

export interface AuthenticatedRestaurantRequest extends Request {
  restaurantId?: string;
}

export const authenticateRestaurant = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('Restaurant auth: No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { restaurantId: string };
    console.log('Restaurant auth: Decoded restaurant ID:', decoded.restaurantId);
    req.restaurantId = decoded.restaurantId;
    next();
  } catch (error) {
    console.log('Restaurant auth: Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}