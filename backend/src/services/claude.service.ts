import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { InferenceAngles } from '../types';

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
    dataType: '1st-party' | '3rd-party'
  ): Promise<InferenceAngles> {
    try {
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

      // Calculate confidence scores (simplified - could be enhanced)
      const calculateConfidence = (text: string): number => {
        // Basic heuristic: longer responses with more evidence tend to be more confident
        const evidenceCount = (text.match(/evidence:/gi) || []).length;
        const wordCount = text.split(' ').length;
        const baseConfidence = 0.7;
        const evidenceBonus = Math.min(evidenceCount * 0.05, 0.15);
        const lengthBonus = Math.min(wordCount / 1000, 0.15);
        return Math.min(baseConfidence + evidenceBonus + lengthBonus, 0.95);
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

      return {
        conservative: {
          text: conservativeText,
          confidence: calculateConfidence(conservativeText),
          angle: 'conservative',
        },
        progressive: {
          text: progressiveText,
          confidence: calculateConfidence(progressiveText),
          angle: 'progressive',
        },
        synthetic: {
          text: syntheticText,
          confidence: calculateConfidence(syntheticText),
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