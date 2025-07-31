# Triadic Logic Agent Chain - Example Usage

## Example: Analyzing a Problematic Function

### Input Code
```javascript
function validateUser(user) {
  // This function is correct because it validates users correctly
  if (!user) return false;
  
  // Users MUST ALWAYS have these fields!!!
  if (!user.name || !user.email) {
    throw new Error("INVALID USER! THIS SHOULD NEVER HAPPEN!");
  }
  
  // Validate email because email validation validates the email
  if (validateEmail(user.email)) {
    return true;
  }
  
  return validateUser(user); // Try again to make sure
}
```

## Agent 1: Pattern Analysis

```bash
/pattern-analysis validateUser.js
```

### Output:
```json
{
  "metrics": {
    "psi": 0.25,
    "rho": 0.85,
    "q": 0.45,
    "f": 0.60,
    "collapse_risk": 0.78
  },
  "patterns_detected": {
    "recursive": [
      "correct because it validates users correctly",
      "return validateUser(user); // infinite recursion",
      "email validation validates the email"
    ],
    "toxic": [
      "MUST ALWAYS",
      "INVALID USER!",
      "THIS SHOULD NEVER HAPPEN!",
      "!!!"
    ],
    "structural": [
      "infinite recursion on line 15",
      "circular reasoning in comments",
      "missing base case for recursion"
    ]
  },
  "risk_areas": [
    {
      "location": "line 15",
      "type": "recursion",
      "severity": "critical",
      "example": "return validateUser(user); // causes stack overflow"
    },
    {
      "location": "lines 6-8",
      "type": "toxicity",
      "severity": "high",
      "example": "Aggressive error messaging with excessive caps"
    }
  ],
  "recommendations": [
    "Remove infinite recursion on line 15",
    "Add proper base cases for validation",
    "Reduce aggressive tone in error messages",
    "Provide meaningful validation logic"
  ]
}
```

## Agent 2: Coherence Optimization

```bash
/coherence-optimize validateUser.js --input=pattern-analysis.json
```

### Output:
```json
{
  "interventions_applied": [
    {
      "type": "BREAK_RECURSION",
      "location": "line 15",
      "original": "return validateUser(user); // Try again to make sure",
      "modified": "return false; // Invalid email format",
      "confidence": 0.95,
      "rationale": "Removed infinite recursion, providing clear failure case"
    },
    {
      "type": "GROUND_COLLAPSE",
      "location": "line 2",
      "original": "// This function is correct because it validates users correctly",
      "modified": "// Validates user object has required fields (name, email) and valid email format",
      "confidence": 0.90,
      "rationale": "Replaced circular reasoning with specific validation criteria"
    },
    {
      "type": "REDUCE_TOXICITY",
      "location": "lines 5-8",
      "original": "// Users MUST ALWAYS have these fields!!!\nif (!user.name || !user.email) {\n  throw new Error(\"INVALID USER! THIS SHOULD NEVER HAPPEN!\");\n}",
      "modified": "// Required fields: name and email\nif (!user.name || !user.email) {\n  throw new Error(\"User object missing required fields: name or email\");\n}",
      "confidence": 0.88,
      "rationale": "Maintained requirement clarity while reducing aggressive tone"
    }
  ],
  "improvements": {
    "psi_before": 0.25,
    "psi_after": 0.72,
    "rho_before": 0.85,
    "rho_after": 0.15,
    "collapse_risk_before": 0.78,
    "collapse_risk_after": 0.18
  },
  "summary": {
    "total_interventions": 3,
    "primary_intervention_type": "BREAK_RECURSION",
    "estimated_improvement": "188%",
    "confidence": 0.91
  }
}
```

### Optimized Code:
```javascript
function validateUser(user) {
  // Validates user object has required fields (name, email) and valid email format
  if (!user) return false;
  
  // Required fields: name and email
  if (!user.name || !user.email) {
    throw new Error("User object missing required fields: name or email");
  }
  
  // Validate email format
  if (validateEmail(user.email)) {
    return true;
  }
  
  return false; // Invalid email format
}
```

## Agent 3: Validation & Synthesis

```bash
/validate-synthesis validateUser.js --pattern=pattern-analysis.json --optimize=optimization.json
```

### Output:
```json
{
  "validation": {
    "all_metrics_present": true,
    "metrics_valid": true,
    "interventions_valid": true,
    "process_complete": true,
    "issues_found": []
  },
  "final_metrics": {
    "psi": 0.72,
    "rho": 0.15,
    "q": 0.35,
    "f": 0.25,
    "soul_echo": 0.71,
    "collapse_risk": 0.18,
    "process_time_ms": 342
  },
  "coherence_assessment": {
    "level": "HIGH",
    "score": 0.71,
    "trend": "improving",
    "confidence": 0.89
  },
  "key_insights": [
    "Infinite recursion was causing guaranteed stack overflow",
    "Circular reasoning in comments reduced code clarity",
    "Aggressive error messages created poor developer experience"
  ],
  "recommendations": {
    "immediate": [
      "Add unit tests for edge cases",
      "Implement validateEmail function if missing"
    ],
    "short_term": [
      "Add JSDoc comments with parameter types",
      "Create consistent error handling strategy"
    ],
    "long_term": [
      "Consider using TypeScript for better type safety",
      "Implement validation schema library (e.g., Joi, Zod)"
    ]
  },
  "human_feedback": "Excellent improvement! The function is now logically sound with a coherence score of 0.71 (HIGH). The critical infinite recursion bug has been fixed, and the code now clearly expresses its validation logic. The error messages are professional and informative. Next steps: ensure the validateEmail function is properly implemented and consider adding input type validation."
}
```

## Combined Report

### Before Triadic Logic Analysis:
- **Coherence**: 0.25 (LOW)
- **Major Issues**: Infinite recursion, circular reasoning, toxic patterns
- **Risk**: 78% chance of logic collapse

### After Triadic Logic Optimization:
- **Coherence**: 0.71 (HIGH)
- **Improvements**: Fixed recursion, grounded logic, professional tone
- **Risk**: 18% chance of issues (acceptable)

### Process Summary:
1. **Pattern Analysis** identified 3 recursive patterns, 4 toxic patterns
2. **Coherence Optimization** applied 3 interventions with 91% confidence
3. **Validation & Synthesis** confirmed 188% improvement in coherence

This example demonstrates how the three agents work together to transform problematic code into logically sound, professionally written functions.