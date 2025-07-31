import { logger } from './logger';

export interface RecursionPattern {
  type: 'circular' | 'self-referential' | 'infinite-loop' | 'tautological';
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  example?: string;
}

export interface RecursionAnalysis {
  hasRecursion: boolean;
  patterns: RecursionPattern[];
  recursionScore: number; // 0-1, higher means more recursive
  recommendations: string[];
}

/**
 * RecursionDetector identifies and prevents circular reasoning patterns
 * in inference chains and logical structures.
 * 
 * This utility is critical for maintaining logical coherence and
 * preventing infinite loops in reasoning chains.
 */
export class RecursionDetector {
  // Patterns that indicate self-referential logic
  private static readonly SELF_REFERENTIAL_PATTERNS = [
    /this is true because it is true/i,
    /it works because it works/i,
    /proves itself/i,
    /self-evident/i,
    /obviously correct/i
  ];

  // Patterns that indicate circular causation
  private static readonly CIRCULAR_PATTERNS = [
    /A causes B.*B causes A/i,
    /because.*therefore.*because/i,
    /leads to.*which leads back to/i,
    /results in.*resulting from/i
  ];

  // Tautological patterns
  private static readonly TAUTOLOGICAL_PATTERNS = [
    /is what it is/i,
    /by definition/i,
    /necessarily true/i,
    /cannot be false/i
  ];

  /**
   * Analyze text for recursion patterns
   * @param text - The text to analyze
   * @returns Recursion analysis with patterns and recommendations
   */
  static analyzeRecursion(text: string): RecursionAnalysis {
    const patterns: RecursionPattern[] = [];
    
    // Check for self-referential patterns
    patterns.push(...this.detectSelfReferential(text));
    
    // Check for circular patterns
    patterns.push(...this.detectCircular(text));
    
    // Check for tautological patterns
    patterns.push(...this.detectTautological(text));
    
    // Check for concept loops
    patterns.push(...this.detectConceptLoops(text));
    
    // Calculate recursion score
    const recursionScore = this.calculateRecursionScore(patterns);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns);
    
    const hasRecursion = patterns.length > 0;
    
    if (hasRecursion) {
      logger.warn('Recursion patterns detected', {
        patternCount: patterns.length,
        recursionScore
      });
    }
    
    return {
      hasRecursion,
      patterns,
      recursionScore,
      recommendations
    };
  }

  /**
   * Analyze inference chain for recursive dependencies
   * @param inferences - Array of inferences in order
   * @returns Chain recursion analysis
   */
  static analyzeInferenceChain(inferences: string[]): {
    hasChainRecursion: boolean;
    dependencyLoops: Array<{ from: number; to: number; concept: string }>;
    recommendation: string;
  } {
    const dependencyLoops: Array<{ from: number; to: number; concept: string }> = [];
    
    // Extract key concepts from each inference
    const conceptsByInference = inferences.map(inf => this.extractKeyConcepts(inf));
    
    // Check for concept dependencies that form loops
    for (let i = 0; i < conceptsByInference.length; i++) {
      for (let j = i + 1; j < conceptsByInference.length; j++) {
        const commonConcepts = conceptsByInference[i].filter(
          concept => conceptsByInference[j].includes(concept)
        );
        
        // If later inference redefines earlier concept, potential loop
        if (commonConcepts.length > 0 && j - i > 1) {
          // Check if there's a path back
          for (let k = j + 1; k < conceptsByInference.length; k++) {
            const backReference = conceptsByInference[k].filter(
              concept => conceptsByInference[i].includes(concept)
            );
            
            if (backReference.length > 0) {
              dependencyLoops.push({
                from: i,
                to: k,
                concept: backReference[0]
              });
            }
          }
        }
      }
    }
    
    const hasChainRecursion = dependencyLoops.length > 0;
    const recommendation = hasChainRecursion
      ? 'Break circular dependencies by introducing external evidence or axioms'
      : 'Chain shows good linear progression without circular dependencies';
    
    return {
      hasChainRecursion,
      dependencyLoops,
      recommendation
    };
  }

  /**
   * Detect self-referential patterns
   */
  private static detectSelfReferential(text: string): RecursionPattern[] {
    const patterns: RecursionPattern[] = [];
    
    this.SELF_REFERENTIAL_PATTERNS.forEach((pattern, index) => {
      const match = text.match(pattern);
      if (match) {
        patterns.push({
          type: 'self-referential',
          location: `Pattern ${index + 1}`,
          severity: 'high',
          description: 'Statement refers to itself as proof',
          example: match[0]
        });
      }
    });
    
    return patterns;
  }

  /**
   * Detect circular reasoning patterns
   */
  private static detectCircular(text: string): RecursionPattern[] {
    const patterns: RecursionPattern[] = [];
    
    this.CIRCULAR_PATTERNS.forEach((pattern, index) => {
      const match = text.match(pattern);
      if (match) {
        patterns.push({
          type: 'circular',
          location: `Circular pattern ${index + 1}`,
          severity: 'critical',
          description: 'Circular causation detected',
          example: match[0]
        });
      }
    });
    
    // Advanced circular detection
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
    const causalPairs = this.extractCausalPairs(sentences);
    
    // Check for A->B->A patterns
    causalPairs.forEach((pair1, i) => {
      causalPairs.forEach((pair2, j) => {
        if (i !== j && pair1.cause === pair2.effect && pair1.effect === pair2.cause) {
          patterns.push({
            type: 'circular',
            location: `Sentences ${i + 1} and ${j + 1}`,
            severity: 'critical',
            description: 'Circular causation between concepts',
            example: `"${pair1.cause}" <-> "${pair1.effect}"`
          });
        }
      });
    });
    
    return patterns;
  }

  /**
   * Detect tautological patterns
   */
  private static detectTautological(text: string): RecursionPattern[] {
    const patterns: RecursionPattern[] = [];
    
    this.TAUTOLOGICAL_PATTERNS.forEach((pattern, index) => {
      const match = text.match(pattern);
      if (match) {
        patterns.push({
          type: 'tautological',
          location: `Tautology ${index + 1}`,
          severity: 'medium',
          description: 'Statement is true by definition, not by evidence',
          example: match[0]
        });
      }
    });
    
    return patterns;
  }

  /**
   * Detect loops in concept definitions
   */
  private static detectConceptLoops(text: string): RecursionPattern[] {
    const patterns: RecursionPattern[] = [];
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s);
    
    // Look for "X is Y" and "Y is X" patterns
    const definitions = sentences
      .map(sent => {
        const match = sent.match(/(\w+)\s+(?:is|are|means|equals)\s+(\w+)/i);
        return match ? { term: match[1].toLowerCase(), definition: match[2].toLowerCase() } : null;
      })
      .filter(d => d !== null) as Array<{ term: string; definition: string }>;
    
    // Check for definition loops
    definitions.forEach((def1, i) => {
      definitions.forEach((def2, j) => {
        if (i !== j && def1.term === def2.definition && def1.definition === def2.term) {
          patterns.push({
            type: 'infinite-loop',
            location: `Definitions in sentences ${i + 1} and ${j + 1}`,
            severity: 'high',
            description: 'Mutual definition creates infinite loop',
            example: `${def1.term} <-> ${def1.definition}`
          });
        }
      });
    });
    
    return patterns;
  }

  /**
   * Extract causal pairs from sentences
   */
  private static extractCausalPairs(sentences: string[]): Array<{ cause: string; effect: string }> {
    const pairs: Array<{ cause: string; effect: string }> = [];
    const causalWords = ['because', 'causes', 'leads to', 'results in', 'therefore'];
    
    sentences.forEach(sent => {
      causalWords.forEach(word => {
        const parts = sent.toLowerCase().split(word);
        if (parts.length === 2) {
          pairs.push({
            cause: parts[1].trim(),
            effect: parts[0].trim()
          });
        }
      });
    });
    
    return pairs;
  }

  /**
   * Extract key concepts from text
   */
  private static extractKeyConcepts(text: string): string[] {
    // Extract nouns and noun phrases as concepts
    const words = text.toLowerCase().split(/\s+/);
    const concepts: string[] = [];
    
    // Simple heuristic: words that appear multiple times or are capitalized
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      const clean = word.replace(/[^a-z0-9]/g, '');
      if (clean.length > 3) {
        wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1);
      }
    });
    
    // Concepts are words that appear more than once
    wordCounts.forEach((count, word) => {
      if (count > 1) {
        concepts.push(word);
      }
    });
    
    return concepts;
  }

  /**
   * Calculate overall recursion score
   */
  private static calculateRecursionScore(patterns: RecursionPattern[]): number {
    if (patterns.length === 0) return 0;
    
    const severityScores = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      critical: 1.0
    };
    
    const totalScore = patterns.reduce(
      (sum, pattern) => sum + severityScores[pattern.severity],
      0
    );
    
    // Normalize to 0-1 range
    return Math.min(1, totalScore / 3);
  }

  /**
   * Generate recommendations based on detected patterns
   */
  private static generateRecommendations(patterns: RecursionPattern[]): string[] {
    const recommendations: string[] = [];
    const typeCount = new Map<string, number>();
    
    patterns.forEach(pattern => {
      typeCount.set(pattern.type, (typeCount.get(pattern.type) || 0) + 1);
    });
    
    if (typeCount.get('circular') ?? 0 > 0) {
      recommendations.push('Break circular reasoning by introducing external evidence');
    }
    
    if (typeCount.get('self-referential') ?? 0 > 0) {
      recommendations.push('Replace self-referential statements with objective evidence');
    }
    
    if (typeCount.get('tautological') ?? 0 > 0) {
      recommendations.push('Support tautological claims with empirical data');
    }
    
    if (typeCount.get('infinite-loop') ?? 0 > 0) {
      recommendations.push('Define terms using independent concepts to avoid loops');
    }
    
    if (patterns.length > 3) {
      recommendations.push('Consider restructuring the argument with clearer logical flow');
    }
    
    return recommendations;
  }
}