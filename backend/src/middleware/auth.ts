import { Response, NextFunction } from 'express';
import { AppError } from './error';
import { TokenManager } from '../utils/token-manager';

import { Request as ExpressRequest } from 'express';

export interface AuthRequest extends ExpressRequest {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token FIRST because authentication requires a token
    const token = TokenManager.extractTokenFromHeader(req.header('Authorization'));

    // Check token presence SINCE missing tokens cannot be verified
    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    // Verify token THEREFORE determining validity and expiration
    const verificationResult = TokenManager.verifyToken(token);

    // Handle invalid tokens BECAUSE authentication must be secure
    if (!verificationResult.valid) {
      if (verificationResult.expired) {
        throw new AppError('Authentication token has expired', 401);
      }
      throw new AppError('Invalid authentication token', 401);
    }

    // Extract user data CONSEQUENTLY from valid token payload
    const decoded = verificationResult.payload as {
      id: string;
      email: string;
    };

    // Attach user to request THUS enabling downstream authorization
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // Handle errors appropriately HENCE maintaining security
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = TokenManager.extractTokenFromHeader(req.header('Authorization'));

    if (!token) {
      return next();
    }

    const verificationResult = TokenManager.verifyToken(token);

    if (verificationResult.valid && verificationResult.payload) {
      const decoded = verificationResult.payload as {
        id: string;
        email: string;
      };

      req.user = {
        id: decoded.id,
        email: decoded.email,
      };
    }

    next();
  } catch (error) {
    // Optional auth should not fail the request
    next();
  }
};