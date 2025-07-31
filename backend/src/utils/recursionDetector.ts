/**
 * Recursion detection for inference generation
 */

interface InferenceNode {
  id: string;
  content: string;
  dependencies: string[];
}

export class RecursionDetector {
  private static readonly MAX_DEPTH = 5;
  private static readonly SIMILARITY_THRESHOLD = 0.8;

  /**
   * Check if a new inference creates a recursive pattern
   */
  static detectRecursion(
    newInference: string,
    existingInferences: Array<{ id: string; content: string }>
  ): { hasRecursion: boolean; cycleDepth?: number; similarityScore?: number } {
    // Check for self-referential patterns
    if (this.isSelfReferential(newInference)) {
      return { hasRecursion: true, cycleDepth: 1 };
    }

    // Check for circular reasoning patterns
    const circularPattern = this.detectCircularReasoning(newInference);
    if (circularPattern) {
      return { hasRecursion: true, cycleDepth: 2 };
    }

    // Check similarity with existing inferences
    for (const existing of existingInferences) {
      const similarity = this.calculateSimilarity(newInference, existing.content);
      if (similarity > this.SIMILARITY_THRESHOLD) {
        return { 
          hasRecursion: true, 
          similarityScore: similarity,
          cycleDepth: 1 
        };
      }
    }

    return { hasRecursion: false };
  }

  /**
   * Detect self-referential patterns
   */
  private static isSelfReferential(text: string): boolean {
    const selfRefPatterns = [
      /this inference shows that this inference/i,
      /we can conclude that we can conclude/i,
      /it follows that it follows/i,
      /therefore.*therefore.*therefore/i,
    ];

    return selfRefPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect circular reasoning patterns
   */
  private static detectCircularReasoning(text: string): boolean {
    // Extract logical statements
    const statements = text.split(/[.!?]/).filter(s => s.trim().length > 10);
    
    // Check for A → B → A patterns
    const implications: Array<[string, string]> = [];
    
    for (const statement of statements) {
      const implicationMatch = statement.match(
        /(.*?)\s+(implies|suggests|indicates|shows that|means that)\s+(.*)/i
      );
      
      if (implicationMatch) {
        const premise = this.normalizeStatement(implicationMatch[1]);
        const conclusion = this.normalizeStatement(implicationMatch[3]);
        
        // Check if this creates a cycle
        for (const [prevPremise, prevConclusion] of implications) {
          if (
            this.areStatementsSimilar(premise, prevConclusion) &&
            this.areStatementsSimilar(conclusion, prevPremise)
          ) {
            return true; // Found circular reasoning
          }
        }
        
        implications.push([premise, conclusion]);
      }
    }

    return false;
  }

  /**
   * Calculate similarity between two texts
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Jaccard similarity
    return intersection.size / union.size;
  }

  /**
   * Normalize a statement for comparison
   */
  private static normalizeStatement(statement: string): string {
    return statement
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  /**
   * Check if two statements are similar
   */
  private static areStatementsSimilar(stmt1: string, stmt2: string): boolean {
    const similarity = this.calculateSimilarity(stmt1, stmt2);
    return similarity > 0.7;
  }

  /**
   * Tokenize text for comparison
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  /**
   * Build inference dependency graph
   */
  static buildDependencyGraph(
    inferences: Array<{
      id: string;
      content: string;
      references?: string[];
    }>
  ): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    
    for (const inference of inferences) {
      if (!graph.has(inference.id)) {
        graph.set(inference.id, new Set());
      }
      
      // Add explicit references
      if (inference.references) {
        for (const ref of inference.references) {
          graph.get(inference.id)!.add(ref);
        }
      }
      
      // Detect implicit references
      for (const other of inferences) {
        if (other.id !== inference.id) {
          const mentioned = inference.content.includes(other.id) ||
            this.calculateSimilarity(inference.content, other.content) > 0.9;
          
          if (mentioned) {
            graph.get(inference.id)!.add(other.id);
          }
        }
      }
    }
    
    return graph;
  }

  /**
   * Find cycles in dependency graph using DFS
   */
  static findCycles(graph: Map<string, Set<string>>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    const dfs = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          cycles.push(path.slice(cycleStart));
          return true;
        }
      }
      
      path.pop();
      recursionStack.delete(node);
      return false;
    };
    
    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }
    
    return cycles;
  }
}