
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthRequest extends Request {
  user?: {
    id: bigint;
    email: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.userId) }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export { AuthRequest };
