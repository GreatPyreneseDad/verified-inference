import { InferenceModel, Inference } from '../models/inference.model';
import { QueryModel } from '../models/query.model';
import { UserModel } from '../models/user.model';
import { LogicalAnalyzer } from '../utils/logicalAnalysis';
import { RecursionDetector } from '../utils/recursion-detector';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error';

interface VerificationRequest {
  inferenceId: string;
  userId: string;
  selectedInference: 'A' | 'B' | 'C' | 'custom';
  customInference?: string;
  correct: boolean;
  rationale: string;
  confidenceScore?: number;
}

interface VerificationResult {
  inference: Inference;
  coherenceScore: number;
  logicalMetrics: {
    consistency: number;
    evidenceStrength: number;
    reasoningClarity: number;
  };
}

export class VerificationService {
  /**
   * Unified verification pipeline with coherence analysis
   */
  static async verifyInference(request: VerificationRequest): Promise<VerificationResult> {
    const {
      inferenceId,
      userId,
      selectedInference,
      customInference,
      correct,
      rationale,
      confidenceScore,
    } = request;

    // Step 1: Validate access
    const inference = await InferenceModel.findById(inferenceId);
    if (!inference) {
      throw new AppError('Inference not found', 404);
    }

    const query = await QueryModel.findById(inference.query_id);
    if (!query || query.user_id !== userId) {
      throw new AppError('Unauthorized access to this inference', 403);
    }

    // Step 2: Determine the actual inference text
    let inferenceText: string;
    if (selectedInference === 'custom' && customInference) {
      inferenceText = customInference;
    } else {
      const inferenceMap = {
        'A': inference.inference_a,
        'B': inference.inference_b,
        'C': inference.inference_c,
      };
      inferenceText = inferenceMap[selectedInference as 'A' | 'B' | 'C'] || '';
    }

    // Step 3: Analyze logical coherence
    const logicalMetrics = LogicalAnalyzer.analyzeInference(
      inferenceText,
      rationale,
      query.context
    );

    const coherenceScore = LogicalAnalyzer.calculateCoherenceScore(logicalMetrics);
    
    // Step 3b: Check for recursion patterns
    const recursionAnalysis = RecursionDetector.analyzeRecursion(
      `${inferenceText} ${rationale}`
    );
    
    // Adjust coherence if recursion is detected
    let finalCoherence = coherenceScore;
    if (recursionAnalysis.hasRecursion) {
      finalCoherence *= (1 - recursionAnalysis.recursionScore * 0.5);
      logger.warn('Recursion detected in verification', {
        inferenceId,
        recursionScore: recursionAnalysis.recursionScore,
        patterns: recursionAnalysis.patterns.length
      });
    }

    // Step 4: Adjust confidence based on coherence and recursion
    const adjustedConfidence = this.adjustConfidence(
      confidenceScore || 0.7,
      finalCoherence,
      correct
    );

    // Step 5: Persist verification with metrics
    const updatedInference = await InferenceModel.verify(
      inferenceId,
      selectedInference,
      customInference || null,
      correct,
      rationale,
      adjustedConfidence,
      logicalMetrics
    );

    // Step 6: Update user statistics
    await this.updateUserStats(userId, correct, coherenceScore);

    // Step 7: Log verification event
    logger.info(
      `Inference verified: ${inferenceId} by user: ${userId}, ` +
      `correct: ${correct}, coherence: ${coherenceScore.toFixed(2)}`
    );

    return {
      inference: updatedInference,
      coherenceScore,
      logicalMetrics,
    };
  }

  /**
   * Adjust confidence based on multiple factors including coherence,
   * correctness, and logical structure
   */
  private static adjustConfidence(
    originalConfidence: number,
    coherenceScore: number,
    correct: boolean
  ): number {
    // Base adjustment factors
    let adjustmentFactor = 1.0;
    
    // Factor 1: Correctness impact
    if (!correct) {
      // Incorrect inferences get significant reduction
      adjustmentFactor *= 0.5;
    } else {
      // Correct inferences get slight boost
      adjustmentFactor *= 1.1;
    }
    
    // Factor 2: Coherence impact (non-linear)
    // High coherence (>0.8) provides stronger boost
    // Low coherence (<0.4) provides stronger penalty
    const coherenceMultiplier = coherenceScore < 0.4 
      ? 0.5 + coherenceScore * 1.25  // Range: 0.5 to 1.0
      : coherenceScore < 0.8
      ? 0.9 + coherenceScore * 0.25   // Range: 0.9 to 1.1
      : 1.0 + (coherenceScore - 0.8) * 0.5; // Range: 1.0 to 1.1
    
    adjustmentFactor *= coherenceMultiplier;
    
    // Factor 3: Confidence extremes adjustment
    // Very high or very low original confidence is moderated
    if (originalConfidence > 0.9) {
      // High confidence needs stronger evidence
      adjustmentFactor *= 0.9;
    } else if (originalConfidence < 0.3) {
      // Low confidence gets slight boost to encourage exploration
      adjustmentFactor *= 1.1;
    }
    
    // Apply adjustments
    const adjustedConfidence = originalConfidence * adjustmentFactor;
    
    // Ensure bounds with more nuanced limits
    // Never fully certain (max 0.95) or fully uncertain (min 0.1)
    return Math.max(0.1, Math.min(0.95, adjustedConfidence));
  }

  /**
   * Update user statistics with coherence tracking
   */
  private static async updateUserStats(
    userId: string,
    correct: boolean,
    coherenceScore: number
  ): Promise<void> {
    await UserModel.updateStats(userId, 'total_verifications');
    
    if (correct) {
      await UserModel.updateStats(userId, 'correct_verifications');
    }

    // Track high-coherence verifications
    if (coherenceScore >= 0.8) {
      await UserModel.updateStats(userId, 'high_coherence_verifications');
    }
  }

  /**
   * Get verification recommendations based on patterns
   */
  static async getVerificationRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<Inference[]> {
    // Get user's verification history to understand patterns
    const userStats = await UserModel.getVerificationHistory(userId);
    
    // Prioritize inferences that match user's expertise
    const unverifiedInferences = await InferenceModel.getUnverified(limit * 2);
    
    // Sort by relevance to user's history
    return unverifiedInferences
      .sort((a, b) => {
        // Prioritize based on data type preference
        const aScore = userStats.preferredDataType === a.data_type ? 1 : 0;
        const bScore = userStats.preferredDataType === b.data_type ? 1 : 0;
        return bScore - aScore;
      })
      .slice(0, limit);
  }
  
  /**
   * Analyze entire query chain for recursion patterns
   */
  static async analyzeQueryChainRecursion(queryId: string): Promise<{
    hasRecursion: boolean;
    overallRecursionScore: number;
    criticalInferences: string[];
    recommendations: string[];
  }> {
    // Get all inferences for the query
    const inferences = await InferenceModel.findByQueryId(queryId);
    
    if (inferences.length === 0) {
      return {
        hasRecursion: false,
        overallRecursionScore: 0,
        criticalInferences: [],
        recommendations: []
      };
    }
    
    // Extract inference texts in order
    const inferenceTexts = inferences.map(inf => {
      // Use custom inference if available, otherwise selected inference, otherwise A
      if (inf.custom_inference) return inf.custom_inference;
      if (inf.selected_inference === 'A') return inf.inference_a;
      if (inf.selected_inference === 'B') return inf.inference_b;
      if (inf.selected_inference === 'C') return inf.inference_c;
      return inf.inference_a; // Default to A
    });
    
    // Analyze chain for recursion
    const chainAnalysis = RecursionDetector.analyzeInferenceChain(inferenceTexts);
    
    // Analyze individual inferences
    const individualAnalyses = inferences.map(inf => {
      // Use custom inference if available, otherwise selected inference, otherwise A
      let text: string;
      if (inf.custom_inference) {
        text = inf.custom_inference;
      } else if (inf.selected_inference === 'B') {
        text = inf.inference_b;
      } else if (inf.selected_inference === 'C') {
        text = inf.inference_c;
      } else {
        text = inf.inference_a;
      }
      
      return {
        id: inf.id,
        analysis: RecursionDetector.analyzeRecursion(text)
      };
    });
    
    // Find critical inferences (high recursion)
    const criticalInferences = individualAnalyses
      .filter(item => item.analysis.recursionScore > 0.7)
      .map(item => item.id);
    
    // Calculate overall score
    const overallRecursionScore = individualAnalyses.reduce(
      (sum, item) => sum + item.analysis.recursionScore,
      0
    ) / individualAnalyses.length;
    
    // Compile recommendations
    const recommendations: string[] = [];
    if (chainAnalysis.hasChainRecursion) {
      recommendations.push(chainAnalysis.recommendation);
    }
    if (overallRecursionScore > 0.5) {
      recommendations.push('Consider introducing external evidence to ground the reasoning');
    }
    if (criticalInferences.length > 0) {
      recommendations.push(`Review and revise ${criticalInferences.length} inferences with high recursion`);
    }
    
    return {
      hasRecursion: chainAnalysis.hasChainRecursion || overallRecursionScore > 0.3,
      overallRecursionScore,
      criticalInferences,
      recommendations
    };
  }
}