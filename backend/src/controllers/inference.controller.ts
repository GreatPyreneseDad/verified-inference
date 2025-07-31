import { Request, Response, NextFunction } from 'express';
import { InferenceModel } from '../models/inference.model';
import { QueryModel } from '../models/query.model';
import { UserModel } from '../models/user.model';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

export const verifyInference = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      selectedInference,
      customInference,
      correct,
      rationale,
      confidenceScore,
    } = req.body;
    const userId = req.user!.id;

    // Get inference
    const inference = await InferenceModel.findById(id);
    if (!inference) {
      throw new AppError('Inference not found', 404);
    }

    // Verify user owns the query
    const query = await QueryModel.findById(inference.query_id);
    if (!query || query.user_id !== userId) {
      throw new AppError('Unauthorized access to this inference', 403);
    }

    // Verify the inference
    const updatedInference = await InferenceModel.verify(
      id,
      selectedInference,
      customInference,
      correct,
      rationale,
      confidenceScore
    );

    // Update user stats
    await UserModel.updateStats(userId, 'total_verifications');
    if (correct) {
      await UserModel.updateStats(userId, 'correct_verifications');
    }

    logger.info(
      `Inference verified: ${id} by user: ${userId}, correct: ${correct}`
    );

    res.json({
      success: true,
      data: {
        inference: updatedInference,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUnverifiedInferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    
    const inferences = await InferenceModel.getUnverified(Number(limit));

    res.json({
      success: true,
      data: {
        inferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInferenceStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await InferenceModel.getVerificationStats();

    res.json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};