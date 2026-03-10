import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'octocat-jwt-secret-key';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    name: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      name: string;
    };
    req.user = { userId: decoded.userId, email: decoded.email, name: decoded.name };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
