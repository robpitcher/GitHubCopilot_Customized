import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'octocat-secret-key';

export interface AuthRequest extends Request {
    userId?: number;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        req.userId = decoded.userId;
        next();
    } catch {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
            req.userId = decoded.userId;
        } catch {
            // Token invalid - continue as anonymous
        }
    }
    next();
}
