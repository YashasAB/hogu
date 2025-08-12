
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export interface AuthenticatedRequest extends Request {
  restaurantId?: string;
}

export const authenticateRestaurant = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { restaurantId: string };
    req.restaurantId = decoded.restaurantId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
