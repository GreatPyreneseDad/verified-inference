/**
 * Logical analysis utilities for coherence metrics
 * Enhanced with triadic logic pattern detection
 */

interface LogicalMetrics {
  consistency: number
  evidenceStrength: number
  reasoningClarity: number
}

// Extended metrics interface for future enhancements
// interface ExtendedMetrics extends LogicalMetrics {
//   psi?: number          // Overall coherence from triadic logic
//   rho?: number          // Recursion density
//   collapseRisk?: number // Risk of logical breakdown
// }

export class LogicalAnalyzer {
  /**
   * Analyze logical coherence of an inference
   */
  static analyzeInference(
    inference: string,
    rationale: string,
    context: string
  ): LogicalMetrics {
    // Analyze logical consistency
    const consistency = this.calculateConsistency(inference, rationale, context)
    
    // Analyze evidence strength
    const evidenceStrength = this.calculateEvidenceStrength(inference, rationale)
    
    // Analyze reasoning clarity
    const reasoningClarity = this.calculateReasoningClarity(rationale)
    
    return {
      consistency,
      evidenceStrength,
      reasoningClarity,
    }
  }

  private static calculateConsistency(
    inference: string,
    rationale: string,
    context: string
  ): number {
    let score = 0.5 // Base score
    
    // Check for logical connectives
    const connectives = ['therefore', 'because', 'since', 'thus', 'hence', 'consequently']
    const hasConnectives = connectives.some(conn => 
      rationale.toLowerCase().includes(conn) || inference.toLowerCase().includes(conn)
    )
    if (hasConnectives) score += 0.2
    
    // Check for contradictions
    const contradictionPatterns = [
      /but.*however/i,
      /although.*nevertheless/i,
      /despite.*still/i,
    ]
    const hasContradictions = contradictionPatterns.some(pattern => 
      rationale.match(pattern) || inference.match(pattern)
    )
    if (hasContradictions) score -= 0.2
    
    // Check for recursive patterns (triadic logic)
    const recursiveIndicators = ['proves', 'clearly', 'obviously', 'definitely']
    const recursiveCount = recursiveIndicators.filter(ind => 
      inference.toLowerCase().includes(ind)
    ).length
    if (recursiveCount > 2) score -= 0.15
    
    // Check for toxic absolutism
    const toxicPatterns = ['must always', 'never', 'impossible', 'guaranteed']
    const hasToxic = toxicPatterns.some(pattern => 
      inference.toLowerCase().includes(pattern)
    )
    if (hasToxic) score -= 0.1
    
    // Check alignment with context
    const contextWords = context.toLowerCase().split(/\s+/)
    const inferenceWords = inference.toLowerCase().split(/\s+/)
    const overlap = inferenceWords.filter(word => 
      contextWords.includes(word) && word.length > 3
    ).length
    const alignmentScore = Math.min(overlap / 10, 0.3)
    score += alignmentScore
    
    return Math.max(0, Math.min(1, score))
  }

  private static calculateEvidenceStrength(
    inference: string,
    rationale: string
  ): number {
    let score = 0.3 // Base score
    
    // Check for evidence markers
    const evidenceMarkers = [
      'evidence:', 'based on', 'according to', 'data shows',
      'research indicates', 'studies suggest', 'analysis reveals'
    ]
    const evidenceCount = evidenceMarkers.filter(marker => 
      rationale.toLowerCase().includes(marker) || inference.toLowerCase().includes(marker)
    ).length
    score += Math.min(evidenceCount * 0.15, 0.4)
    
    // Check for citations or references
    const citationPatterns = [
      /\[\d+\]/, // [1], [2], etc.
      /\(\d{4}\)/, // (2023), (2024), etc.
      /https?:\/\//, // URLs
    ]
    const hasCitations = citationPatterns.some(pattern => 
      rationale.match(pattern) || inference.match(pattern)
    )
    if (hasCitations) score += 0.2
    
    // Check for quantitative data
    const quantitativePatterns = [
      /\d+%/, // percentages
      /\$\d+/, // monetary values
      /\d+\s*(times|x)/, // multipliers
    ]
    const hasQuantitative = quantitativePatterns.some(pattern => 
      rationale.match(pattern) || inference.match(pattern)
    )
    if (hasQuantitative) score += 0.1
    
    return Math.max(0, Math.min(1, score))
  }

  private static calculateReasoningClarity(rationale: string): number {
    let score = 0.4 // Base score
    
    // Check for structured reasoning
    const structureMarkers = [
      'first', 'second', 'third',
      'additionally', 'furthermore', 'moreover',
      'in conclusion', 'to summarize', 'overall'
    ]
    const structureCount = structureMarkers.filter(marker => 
      rationale.toLowerCase().includes(marker)
    ).length
    score += Math.min(structureCount * 0.1, 0.3)
    
    // Check for clear cause-effect relationships
    const causalMarkers = [
      'causes', 'leads to', 'results in', 'due to',
      'because of', 'as a result', 'consequently'
    ]
    const hasCausal = causalMarkers.some(marker => 
      rationale.toLowerCase().includes(marker)
    )
    if (hasCausal) score += 0.2
    
    // Penalize excessive length (unclear reasoning tends to be verbose)
    const wordCount = rationale.split(/\s+/).length
    if (wordCount > 200) score -= 0.1
    if (wordCount < 20) score -= 0.2 // Too brief
    
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate overall coherence score
   */
  static calculateCoherenceScore(metrics: LogicalMetrics): number {
    // Weighted average with emphasis on consistency
    return (
      metrics.consistency * 0.4 +
      metrics.evidenceStrength * 0.35 +
      metrics.reasoningClarity * 0.25
    )
  }
  
  /**
   * Detect circular reasoning patterns
   */
  static detectCircularReasoning(text: string): boolean {
    // Pattern: X because Y, Y because X
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s)
    
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const sent1 = sentences[i].toLowerCase()
        const sent2 = sentences[j].toLowerCase()
        
        // Check if concepts appear in reverse causal order
        if (sent1.includes('because') && sent2.includes('because')) {
          const parts1 = sent1.split('because')
          const parts2 = sent2.split('because')
          
          if (parts1.length === 2 && parts2.length === 2) {
            const cause1 = parts1[1].trim()
            const effect1 = parts1[0].trim()
            const cause2 = parts2[1].trim()
            const effect2 = parts2[0].trim()
            
            // Simplified check for circular pattern
            if (this.similarConcepts(cause1, effect2) && 
                this.similarConcepts(cause2, effect1)) {
              return true
            }
          }
        }
      }
    }
    
    return false
  }
  
  /**
   * Check if two text fragments refer to similar concepts
   */
  private static similarConcepts(text1: string, text2: string): boolean {
    const words1 = text1.split(/\s+/).filter(w => w.length > 3)
    const words2 = text2.split(/\s+/).filter(w => w.length > 3)
    
    const commonWords = words1.filter(w => words2.includes(w))
    const similarity = commonWords.length / Math.min(words1.length, words2.length)
    
    return similarity > 0.5
  }
}