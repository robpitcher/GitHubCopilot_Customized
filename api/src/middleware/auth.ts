import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET environment variable must be set in production');
        }
        console.warn('[Auth] WARNING: JWT_SECRET not set. Using insecure default for development only.');
        return 'octocat-supply-dev-secret-do-not-use-in-prod';
    }
    return secret;
})();
export const JWT_EXPIRY = '24h';

export interface AuthenticatedRequest extends Request {
    userId?: number;
    userEmail?: string;
}

/**
 * Middleware that validates a JWT bearer token and attaches userId to the request.
 * Returns 401 if the token is missing or invalid.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
        req.userId = payload.userId;
        req.userEmail = payload.email;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
