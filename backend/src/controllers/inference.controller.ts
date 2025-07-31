import { Request, Response, NextFunction } from 'express';
import { InferenceModel } from '../models/inference.model';
import { AuthRequest } from '../middleware/auth';
import { VerificationService } from '../services/verification.service';

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

    // Use unified verification service
    const verificationResult = await VerificationService.verifyInference({
      inferenceId: id,
      userId,
      selectedInference,
      customInference,
      correct,
      rationale,
      confidenceScore,
    });

    res.json({
      success: true,
      data: {
        inference: verificationResult.inference,
        coherenceScore: verificationResult.coherenceScore,
        logicalMetrics: verificationResult.logicalMetrics,
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
  _req: Request,
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