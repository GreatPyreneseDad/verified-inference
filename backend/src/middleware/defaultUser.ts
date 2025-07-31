import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserModel } from '../models/user.model';
import { logger } from '../utils/logger';

// Default test user for development/testing
const DEFAULT_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'test@verified-inference.com',
  username: 'test_user'
};

/**
 * Middleware that adds a default user to all requests
 * This bypasses authentication for testing purposes
 */
export const useDefaultUser = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if default user exists in database
    let user = await UserModel.findByEmail(DEFAULT_USER.email);
    
    if (!user) {
      // Create default user if it doesn't exist
      logger.info('Creating default test user');
      user = await UserModel.create(
        DEFAULT_USER.email,
        DEFAULT_USER.username,
        'TestPassword123!' // This won't be used since we're bypassing auth
      );
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    };
    
    next();
  } catch (error) {
    logger.error('Error setting default user:', error);
    // Continue anyway with hardcoded user
    req.user = DEFAULT_USER;
    next();
  }
};