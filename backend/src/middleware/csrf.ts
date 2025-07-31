import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from './error';

// Store CSRF tokens (in production, use Redis or similar)
const csrfTokens = new Map<string, { token: string; expires: number }>();

// Generate CSRF token
export const generateCSRFToken = (sessionId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  csrfTokens.set(sessionId, { token, expires });
  return token;
};

// Verify CSRF token
export const verifyCSRFToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  
  // Clean up expired tokens
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
};

// CSRF middleware
export const csrfProtection = (req: Request, _res: Response, next: NextFunction) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for authentication endpoints (they don't have tokens yet)
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string;
  const sessionId = (req as any).user?.id || req.ip;
  
  if (!token || !verifyCSRFToken(sessionId, token)) {
    throw new AppError('Invalid CSRF token', 403);
  }
  
  next();
};

// Endpoint to get CSRF token
export const getCSRFToken = (req: Request, res: Response) => {
  const sessionId = (req as any).user?.id || req.ip;
  const token = generateCSRFToken(sessionId);
  
  res.json({ csrfToken: token });
};

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expires < now) {
      csrfTokens.delete(sessionId);
    }
  }
}, 300000); // Every 5 minutes