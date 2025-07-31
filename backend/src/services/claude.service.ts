import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { InferenceAngles } from '../types';
import { RecursionDetector } from '../utils/recursion-detector';
import { InferenceModel } from '../models/inference.model';
import { LogicalAnalyzer } from '../utils/logicalAnalysis';

export class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.claude.apiKey,
    });
  }

  /**
   * Generate three different inference angles for a query
   */
  async generateInferenceAngles(
    query: string,
    context: string,
    dataType: '1st-party' | '3rd-party',
    queryId?: string
  ): Promise<InferenceAngles> {
    try {
      // Get existing inferences to check for recursion patterns if queryId provided
      // This can be enhanced later to check against previous inferences
      // Generate conservative inference
      const conservativePrompt = `Given the query: "${query}"
Context: ${context}
Data type: ${dataType}

Provide a conservative, data-grounded inference that stays close to explicit evidence. 
Be cautious about extrapolation and focus on what can be directly supported.
Include specific evidence citations where possible.
Format: Provide the inference followed by "Evidence:" and list supporting points.`;

      const conservativeResponse = await this.anthropic.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        messages: [{ role: 'user', content: conservativePrompt }],
      });

      // Generate progressive inference
      const progressivePrompt = `Given the query: "${query}"
Context: ${context}
Data type: ${dataType}

Provide an innovative inference that explores reasonable extrapolations and patterns.
Look for emerging trends, potential connections, and forward-looking insights.
Be bold but maintain logical consistency.
Format: Provide the inference followed by "Evidence:" and list supporting points.`;

      const progressiveResponse = await this.anthropic.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        messages: [{ role: 'user', content: progressivePrompt }],
      });

      // Generate synthetic inference
      const syntheticPrompt = `Given the query: "${query}"
Context: ${context}
Data type: ${dataType}

Provide a synthetic inference that bridges multiple perspectives and finds middle ground.
Integrate different viewpoints, reconcile contradictions, and create a balanced synthesis.
Look for ways to combine conservative and progressive insights.
Format: Provide the inference followed by "Evidence:" and list supporting points.`;

      const syntheticResponse = await this.anthropic.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        messages: [{ role: 'user', content: syntheticPrompt }],
      });

      // Calculate confidence based on logical coherence and evidence quality
      const calculateConfidence = (text: string, angle: string, context: string): number => {
        // Extract evidence section if present
        const evidenceMatch = text.match(/evidence:(.*)/is);
        const evidenceText = evidenceMatch ? evidenceMatch[1] : '';
        
        // Base confidence varies by angle type
        const baseConfidences = {
          conservative: 0.75, // Higher base for conservative
          progressive: 0.65,  // Lower base for progressive
          synthetic: 0.70,    // Medium base for synthetic
        };
        let confidence = baseConfidences[angle as keyof typeof baseConfidences] || 0.7;
        
        // Evidence quality factors
        const evidenceFactors = {
          hasMultiplePoints: (evidenceText.match(/\n\s*[-•]/g) || []).length >= 2,
          hasCitations: /\[\d+\]|\(\d{4}\)|https?:\/\//.test(text),
          hasQuantitative: /\d+%|\$\d+|\d+\s*(times|x)/.test(text),
          hasLogicalFlow: /therefore|because|since|thus|hence/.test(text.toLowerCase()),
        };
        
        // Apply evidence-based adjustments
        if (evidenceFactors.hasMultiplePoints) confidence += 0.08;
        if (evidenceFactors.hasCitations) confidence += 0.07;
        if (evidenceFactors.hasQuantitative) confidence += 0.05;
        if (evidenceFactors.hasLogicalFlow) confidence += 0.05;
        
        // Penalize over-confidence indicators
        const overconfidenceMarkers = /absolutely|definitely|certainly|undoubtedly/gi;
        const overconfidenceCount = (text.match(overconfidenceMarkers) || []).length;
        confidence -= overconfidenceCount * 0.03;
        
        // Apply logical coherence analysis
        const logicalMetrics = LogicalAnalyzer.analyzeInference(
          text,
          evidenceText,
          context
        );
        const coherenceScore = LogicalAnalyzer.calculateCoherenceScore(logicalMetrics);
        
        // Check for circular reasoning
        if (LogicalAnalyzer.detectCircularReasoning(text)) {
          confidence *= 0.7; // Significant penalty for circular reasoning
        }
        
        // Integrate coherence into confidence
        // High coherence boosts confidence, low coherence reduces it
        const coherenceAdjustment = (coherenceScore - 0.5) * 0.3;
        confidence += coherenceAdjustment;
        
        // Apply angle-specific adjustments
        if (angle === 'progressive' && logicalMetrics.evidenceStrength < 0.4) {
          // Progressive inferences need some evidence grounding
          confidence *= 0.85;
        }
        if (angle === 'synthetic' && logicalMetrics.consistency < 0.5) {
          // Synthetic inferences need internal consistency
          confidence *= 0.8;
        }
        
        // Ensure reasonable bounds with nuanced limits
        return Math.max(0.45, Math.min(0.92, confidence));
      };

      const conservativeText = conservativeResponse.content[0].type === 'text' 
        ? conservativeResponse.content[0].text 
        : '';
      const progressiveText = progressiveResponse.content[0].type === 'text' 
        ? progressiveResponse.content[0].text 
        : '';
      const syntheticText = syntheticResponse.content[0].type === 'text' 
        ? syntheticResponse.content[0].text 
        : '';

      // Check for recursion in generated inferences
      const inferences = [
        { text: conservativeText, angle: 'conservative' },
        { text: progressiveText, angle: 'progressive' },
        { text: syntheticText, angle: 'synthetic' }
      ];

      for (const inference of inferences) {
        const recursionAnalysis = RecursionDetector.analyzeRecursion(inference.text);
        
        if (recursionAnalysis.hasRecursion) {
          console.warn(
            `Recursion detected in ${inference.angle} inference. ` +
            `Score: ${recursionAnalysis.recursionScore.toFixed(2)}, ` +
            `Patterns: ${recursionAnalysis.patterns.length}`
          );
          
          // Add warning to inference text
          inference.text = `[Warning: Recursion patterns detected] ${inference.text}`;
        }
      }

      return {
        conservative: {
          text: conservativeText,
          confidence: calculateConfidence(conservativeText, 'conservative', context),
          angle: 'conservative',
        },
        progressive: {
          text: progressiveText,
          confidence: calculateConfidence(progressiveText, 'progressive', context),
          angle: 'progressive',
        },
        synthetic: {
          text: syntheticText,
          confidence: calculateConfidence(syntheticText, 'synthetic', context),
          angle: 'synthetic',
        },
      };
    } catch (error) {
      console.error('Error generating inferences:', error);
      throw new Error('Failed to generate inference angles');
    }
  }

  /**
   * Generate predictions based on verified inferences
   */
  async generatePredictions(
    verifiedInferences: string[],
    domain: string
  ): Promise<string> {
    const prompt = `Based on these verified inferences:
${verifiedInferences.map((inf, i) => `${i + 1}. ${inf}`).join('\n')}

Domain: ${domain}

Synthesize these verified inferences to generate forward-looking predictions.
Consider patterns, trends, and logical extensions of the verified knowledge.
Provide 3-5 specific predictions with confidence levels (High/Medium/Low).
Format each as: "[Confidence] Prediction: [specific prediction with rationale]"`;

    try {
      const response = await this.anthropic.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Failed to generate predictions';
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw new Error('Failed to generate predictions');
    }
  }
}