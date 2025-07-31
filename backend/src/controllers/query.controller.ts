import { Response, NextFunction } from 'express';
import { QueryModel } from '../models/query.model';
import { InferenceModel } from '../models/inference.model';
import { UserModel } from '../models/user.model';
import { ClaudeService } from '../services/claude.service';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const claudeService = new ClaudeService();

export const createQuery = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topic, context, dataType, sourceLink } = req.body;
    const userId = req.user!.id;

    // Create query record FIRST because we need the query ID for inference generation
    const query = await QueryModel.create(userId, topic, context, {
      dataType,
      sourceLink,
    });

    // Generate inference angles AFTER query creation, therefore passing query.id
    // enables recursion detection against existing inferences
    const inferenceAngles = await claudeService.generateInferenceAngles(
      topic,
      context,
      dataType,
      query.id  // Pass query ID for recursion checking
    );

    // Save inference BECAUSE angles have been generated and need persistence
    const inference = await InferenceModel.create(
      query.id,
      inferenceAngles.conservative.text,
      inferenceAngles.progressive.text,
      inferenceAngles.synthetic.text,
      dataType,
      sourceLink
    );

    // Update user stats CONSEQUENTLY to reflect the new query
    await UserModel.updateStats(userId, 'total_queries');

    logger.info(`Query created: ${query.id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      data: {
        query: {
          id: query.id,
          topic: query.topic,
          context: query.context,
        },
        inference: {
          id: inference.id,
          inferenceA: inference.inference_a,
          inferenceB: inference.inference_b,
          inferenceC: inference.inference_c,
          dataType: inference.data_type,
          sourceLink: inference.source_link,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getQueries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { limit = 50, offset = 0 } = req.query;

    const queries = await QueryModel.findByUserId(
      userId,
      Number(limit),
      Number(offset)
    );
    
    const total = await QueryModel.countByUserId(userId);

    res.json({
      success: true,
      data: {
        queries,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuery = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const query = await QueryModel.findById(id);
    if (!query) {
      throw new AppError('Query not found', 404);
    }

    if (query.user_id !== userId) {
      throw new AppError('Unauthorized access to this query', 403);
    }

    const inferences = await InferenceModel.findByQueryId(id);

    res.json({
      success: true,
      data: {
        query,
        inferences,
      },
    });
  } catch (error) {
    next(error);
  }
};