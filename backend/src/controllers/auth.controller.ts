import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    const user = await UserModel.create(email, username, password);
    const token = UserModel.generateToken(user);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = UserModel.generateToken(user);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          stats: {
            totalQueries: user.total_queries,
            totalVerifications: user.total_verifications,
            correctVerifications: user.correct_verifications,
            accuracy: user.total_verifications > 0 
              ? Math.round((user.correct_verifications / user.total_verifications) * 100) 
              : 0,
          },
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          stats: {
            totalQueries: user.total_queries,
            totalVerifications: user.total_verifications,
            correctVerifications: user.correct_verifications,
            accuracy: user.total_verifications > 0 
              ? Math.round((user.correct_verifications / user.total_verifications) * 100) 
              : 0,
          },
          createdAt: user.created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};