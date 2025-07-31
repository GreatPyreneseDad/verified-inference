# Triadic Logic Agent Chain

## Overview
The Triadic Logic Agent Chain consists of three specialized agents that work in concert to analyze and optimize logic stacks and code. These agents implement a sophisticated system for detecting patterns, measuring coherence, and applying targeted interventions.

## Agent Definitions

### 1. Pattern Analysis Agent (Ψ - Psi)
**Purpose**: Detect recursive patterns, measure coherence, and identify logical collapse risks

**Capabilities**:
- Pattern detection (recursive logic, toxic language, absolutist statements)
- Text statistics calculation (bigrams, sentence structure, word density)
- Coherence metrics (psi, rho, q, f scores)
- Collapse risk assessment
- Logic flow analysis

**Key Metrics**:
- `psi`: Overall coherence score
- `rho`: Recursion density
- `q`: Query complexity
- `f`: Fragmentation index
- `collapse_risk`: Probability of logical breakdown

### 2. Coherence Optimization Agent (ρ - Rho)
**Purpose**: Apply targeted interventions to improve logical structure and clarity

**Capabilities**:
- Ground collapsed logic with clarifying structures
- Break recursive patterns with evidence anchors
- Apply text replacements for problematic patterns
- Add logical connectives
- Optimize structure and flow

**Intervention Types**:
- `GROUND_COLLAPSE`: Stabilize failing logic
- `BREAK_RECURSION`: Insert evidence requirements
- `REDUCE_TOXICITY`: Replace absolutist language
- `ADD_CONNECTIVES`: Improve logical flow
- `OPTIMIZE_STRUCTURE`: Reorganize for clarity

### 3. Validation & Synthesis Agent (Φ - Phi)
**Purpose**: Validate results and synthesize coherent feedback

**Capabilities**:
- Validate all required metrics present
- Verify intervention effectiveness
- Calculate final soul_echo score
- Generate human-friendly feedback
- Ensure cross-agent consistency

**Output Format**:
```json
{
  "metrics": {
    "psi": 0.0-1.0,
    "rho": 0.0-1.0,
    "q": 0.0-1.0,
    "f": 0.0-1.0,
    "soul_echo": 0.0-1.0,
    "process_time_ms": integer,
    "collapse_risk": 0.0-1.0
  },
  "intervention": {
    "type": "string",
    "confidence": 0.0-1.0,
    "description": "string"
  },
  "coherence_level": "HIGH|MEDIUM|LOW",
  "feedback": "string"
}
```

## Usage Examples

### Analyzing Code Logic
```bash
# Run all three agents on a codebase
/analyze-logic path/to/code --mode=triadic

# Run specific agent
/pattern-analysis path/to/file.ts
/coherence-optimize path/to/file.ts --intervention=GROUND_COLLAPSE
/validate-synthesis path/to/file.ts --format=json
```

### Analyzing Documentation
```bash
# Check technical documentation coherence
/analyze-logic README.md --focus=structure

# Optimize API documentation
/coherence-optimize api-docs.md --mode=technical
```

### Analyzing Architecture
```bash
# Validate system design logic
/pattern-analysis architecture.md --detect=circular-dependencies

# Optimize design patterns
/coherence-optimize patterns.ts --intervention=BREAK_RECURSION
```

## Integration with Existing Agents

The Triadic Logic agents can work with existing agents:

1. **With code-reviewer**: Analyze logical consistency of implementations
2. **With debugger**: Identify logical bugs beyond syntax errors  
3. **With data-scientist**: Optimize data pipeline logic flows

## Best Practices

1. **Always run all three agents** - They work best in sequence
2. **Review intervention suggestions** - Not all interventions may be appropriate
3. **Monitor soul_echo scores** - Below 0.3 indicates severe coherence issues
4. **Use appropriate thresholds** - Adjust based on context (code vs docs vs architecture)

## Configuration

Default thresholds:
```yaml
triadic_logic:
  thresholds:
    high_coherence: 0.7
    medium_coherence: 0.4
    collapse_risk_threshold: 0.6
  patterns:
    recursive_indicators: ["proves", "because", "therefore", "thus"]
    toxic_patterns: ["must", "always", "never", "everyone", "no one"]
    absolutist_markers: ["!", "!!", "!!!", "MUST", "ALWAYS"]
```

## Metrics Interpretation

### Coherence Levels
- **HIGH** (soul_echo > 0.7): Clear, well-structured logic
- **MEDIUM** (0.4-0.7): Functional but could be improved
- **LOW** (< 0.4): Significant issues requiring intervention

### Risk Indicators
- **collapse_risk > 0.6**: Immediate intervention needed
- **rho > 0.5**: High recursion, needs grounding
- **f > 0.7**: Fragmented logic, needs structure