import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT tokens from NextAuth
 * Expects Authorization header: Bearer <token>
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Attach user info to request
    req.user = {
      id: decoded.id || decoded.sub,
      username: decoded.name || decoded.username,
      role: decoded.role || 'user'
    };

    console.log(`[Auth] Authenticated user: ${req.user.username}`);
    next();
  } catch (error) {
    console.error('[Auth] Invalid token:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to check if user has admin role
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    console.log(`[Auth] User ${req.user.username} attempted admin action`);
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 * but attaches user info if token is present
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.sub,
      username: decoded.name || decoded.username,
      role: decoded.role || 'user'
    };
  } catch (error) {
    // Invalid token, but continue anyway
    console.warn('[Auth] Invalid token in optional auth');
  }

  next();
}
