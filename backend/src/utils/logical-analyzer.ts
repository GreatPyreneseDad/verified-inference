import { logger } from './logger';

export interface CoherenceMetrics {
  psi: number;              // Overall coherence score (0-1)
  rho: number;              // Recursion density (0-1)
  q: number;                // Query complexity (0-1)
  f: number;                // Fragmentation index (0-1)
  soulEcho: number;         // Combined coherence metric (0-1)
  collapseRisk: number;     // Risk of logical breakdown (0-1)
}

export interface LogicalAnalysis {
  metrics: CoherenceMetrics;
  patterns: {
    recursive: string[];
    toxic: string[];
    structural: string[];
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

/**
 * LogicalAnalyzer provides coherence analysis for inference chains
 * and prevents recursive logic patterns.
 * 
 * Based on triadic logic principles to maintain high coherence
 * and prevent logical collapse in reasoning chains.
 */
export class LogicalAnalyzer {
  // Pattern indicators for analysis
  private static readonly RECURSIVE_INDICATORS = [
    'proves', 'because', 'therefore', 'thus', 'clearly',
    'obviously', 'definitely', 'certainly', 'undoubtedly'
  ];

  private static readonly TOXIC_PATTERNS = [
    'must', 'always', 'never', 'everyone', 'no one',
    'impossible', 'guaranteed', 'absolutely', 'completely'
  ];

  private static readonly ABSOLUTIST_MARKERS = [
    '!', '!!', '!!!', 'MUST', 'ALWAYS', 'NEVER', 'CANNOT'
  ];

  /**
   * Analyze text for logical coherence metrics
   * @param text - The text to analyze
   * @returns Coherence metrics
   */
  static analyzeCoherence(text: string): CoherenceMetrics {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate base metrics
    const recursiveCount = this.countPatterns(text, this.RECURSIVE_INDICATORS);
    const toxicCount = this.countPatterns(text, this.TOXIC_PATTERNS);
    const absolutistCount = this.countPatterns(text, this.ABSOLUTIST_MARKERS);
    
    // Calculate density metrics
    const wordDensity = words.length / Math.max(sentences.length, 1);
    const recursiveDensity = recursiveCount / Math.max(words.length, 1);
    const toxicDensity = toxicCount / Math.max(words.length, 1);
    
    // Calculate coherence scores
    const psi = Math.max(0, 1 - (recursiveDensity * 2 + toxicDensity * 3));
    const rho = Math.min(1, recursiveDensity * 10);
    const q = Math.min(1, wordDensity / 30); // Normalized word density
    const f = Math.min(1, (absolutistCount / words.length) * 20);
    
    // Calculate soul echo (combined coherence)
    const soulEcho = (psi * 0.4 + (1 - rho) * 0.3 + (1 - f) * 0.3);
    
    // Calculate collapse risk
    const collapseRisk = Math.min(1, (rho * 0.5 + f * 0.3 + toxicDensity * 10));
    
    return {
      psi: Math.round(psi * 100) / 100,
      rho: Math.round(rho * 100) / 100,
      q: Math.round(q * 100) / 100,
      f: Math.round(f * 100) / 100,
      soulEcho: Math.round(soulEcho * 100) / 100,
      collapseRisk: Math.round(collapseRisk * 100) / 100
    };
  }

  /**
   * Perform full logical analysis on inference text
   * @param inferenceText - The inference text to analyze
   * @returns Complete logical analysis with patterns and recommendations
   */
  static analyzeInference(inferenceText: string): LogicalAnalysis {
    const metrics = this.analyzeCoherence(inferenceText);
    
    // Detect patterns
    const patterns = {
      recursive: this.detectPatterns(inferenceText, this.RECURSIVE_INDICATORS),
      toxic: this.detectPatterns(inferenceText, this.TOXIC_PATTERNS),
      structural: this.detectStructuralIssues(inferenceText)
    };
    
    // Determine risk level
    const riskLevel = this.calculateRiskLevel(metrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(metrics, patterns);
    
    logger.info('Logical analysis completed', { 
      soulEcho: metrics.soulEcho, 
      riskLevel 
    });
    
    return {
      metrics,
      patterns,
      riskLevel,
      recommendations
    };
  }

  /**
   * Analyze inference chain for overall coherence
   * @param inferences - Array of inference texts in chronological order
   * @returns Chain coherence analysis
   */
  static analyzeInferenceChain(inferences: string[]): {
    overallCoherence: number;
    trend: 'improving' | 'stable' | 'degrading';
    criticalPoints: number[];
  } {
    const analyses = inferences.map(inf => this.analyzeCoherence(inf));
    
    // Calculate overall coherence
    const overallCoherence = analyses.reduce((sum, a) => sum + a.soulEcho, 0) / analyses.length;
    
    // Detect trend
    const firstHalf = analyses.slice(0, Math.floor(analyses.length / 2));
    const secondHalf = analyses.slice(Math.floor(analyses.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, a) => sum + a.soulEcho, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, a) => sum + a.soulEcho, 0) / secondHalf.length;
    
    let trend: 'improving' | 'stable' | 'degrading';
    if (secondAvg > firstAvg + 0.1) trend = 'improving';
    else if (secondAvg < firstAvg - 0.1) trend = 'degrading';
    else trend = 'stable';
    
    // Find critical points (low coherence)
    const criticalPoints = analyses
      .map((a, i) => a.soulEcho < 0.3 ? i : -1)
      .filter(i => i !== -1);
    
    return {
      overallCoherence: Math.round(overallCoherence * 100) / 100,
      trend,
      criticalPoints
    };
  }

  /**
   * Count pattern occurrences in text
   */
  private static countPatterns(text: string, patterns: string[]): number {
    const lowerText = text.toLowerCase();
    return patterns.reduce((count, pattern) => {
      const regex = new RegExp(`\\b${pattern.toLowerCase()}\\b`, 'g');
      const matches = lowerText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Detect specific pattern instances in text
   */
  private static detectPatterns(text: string, patterns: string[]): string[] {
    const found: string[] = [];
    const lowerText = text.toLowerCase();
    
    patterns.forEach(pattern => {
      const regex = new RegExp(`\\b${pattern.toLowerCase()}\\b`, 'g');
      if (regex.test(lowerText)) {
        found.push(pattern);
      }
    });
    
    return found;
  }

  /**
   * Detect structural issues in text
   */
  private static detectStructuralIssues(text: string): string[] {
    const issues: string[] = [];
    
    // Check for circular reasoning
    if (text.match(/because.*therefore.*because/i)) {
      issues.push('Circular reasoning detected');
    }
    
    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.3) {
      issues.push('Excessive capitalization');
    }
    
    // Check for repetitive patterns
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (uniqueWords.size < words.length * 0.5) {
      issues.push('High word repetition');
    }
    
    return issues;
  }

  /**
   * Calculate risk level based on metrics
   */
  private static calculateRiskLevel(metrics: CoherenceMetrics): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (metrics.collapseRisk > 0.8 || metrics.soulEcho < 0.2) return 'CRITICAL';
    if (metrics.collapseRisk > 0.6 || metrics.soulEcho < 0.4) return 'HIGH';
    if (metrics.collapseRisk > 0.4 || metrics.soulEcho < 0.6) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate recommendations based on analysis
   */
  private static generateRecommendations(
    metrics: CoherenceMetrics, 
    patterns: { recursive: string[]; toxic: string[]; structural: string[] }
  ): string[] {
    const recommendations: string[] = [];
    
    if (metrics.rho > 0.5) {
      recommendations.push('Reduce recursive language patterns');
    }
    
    if (metrics.f > 0.5) {
      recommendations.push('Avoid absolutist statements');
    }
    
    if (patterns.toxic.length > 0) {
      recommendations.push('Replace toxic patterns with balanced language');
    }
    
    if (patterns.structural.includes('Circular reasoning detected')) {
      recommendations.push('Break circular reasoning with evidence-based statements');
    }
    
    if (metrics.soulEcho < 0.4) {
      recommendations.push('Restructure inference for better logical flow');
    }
    
    return recommendations;
  }
}