# Verified Inference Development Guide

## Table of Contents
1. [Quick Start Guide](#quick-start-guide)
2. [Architecture Overview](#architecture-overview)
3. [Data Pipeline Documentation](#data-pipeline-documentation)
4. [Performance Benchmarks](#performance-benchmarks)
5. [Code Contribution Guidelines](#code-contribution-guidelines)
6. [Testing Requirements](#testing-requirements)
7. [Deployment Checklist](#deployment-checklist)
8. [Monitoring and Analytics](#monitoring-and-analytics)

## Quick Start Guide

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Claude API key from Anthropic
- Git

### Initial Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd verified-inference
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Create database
createdb verified_inference

# Run schema
psql -d verified_inference -f database/schema.sql

# Apply migrations
psql -d verified_inference -f database/migration_add_username.sql
```

4. **Configure environment variables**
```bash
# Backend (.env in /backend)
DATABASE_URL=postgresql://user:password@localhost:5432/verified_inference
CLAUDE_API_KEY=your_claude_api_key
JWT_SECRET=your-very-strong-secret-minimum-32-chars
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Frontend (.env in /frontend)
VITE_API_URL=http://localhost:3000
```

5. **Start development servers**
```bash
# From root directory
npm run dev
```

This starts both backend (port 3000) and frontend (port 5173) concurrently.

## Architecture Overview

### System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│ Express Backend │────▶│   PostgreSQL    │
│   (TypeScript)  │     │   (TypeScript)  │     │    Database     │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │   Claude API    │
                        │   (Anthropic)   │
                        │                 │
                        └─────────────────┘
```

### Key Components

#### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **State Management**: Zustand for auth, React Query for server state
- **Routing**: React Router v6
- **Styling**: TailwindCSS with shadcn/ui components
- **Build Tool**: Vite

#### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT with refresh tokens
- **Database**: PostgreSQL with raw SQL queries
- **AI Integration**: Claude API (Anthropic SDK)
- **Security**: Helmet, CORS, CSRF protection, rate limiting

#### Database Schema
- **users**: User accounts with stats tracking
- **sessions**: Grouping for queries
- **queries**: User queries with cycle tracking
- **inferences**: AI-generated inferences (A/B/C angles)
- **predictions**: Forward-looking predictions
- **inference_relationships**: Graph structure for inference connections

### Data Flow

1. **Query Submission**
   - User submits query with context
   - Backend validates and stores in `queries` table
   - Triggers inference generation

2. **Inference Generation**
   - Claude API generates 3 angles: conservative, progressive, synthetic
   - Each angle includes confidence scores
   - Stored in `inferences` table with cycle tracking

3. **Human Verification**
   - Users review and select best inference
   - Can provide custom inference if needed
   - Updates user stats and inference records

4. **Prediction Synthesis**
   - Verified inferences feed into prediction generation
   - Claude synthesizes patterns across verified data
   - Predictions stored with confidence levels

## Data Pipeline Documentation

### Inference Generation Pipeline

```sql
-- Query lifecycle
queries (active) → inferences (unverified) → inferences (verified) → predictions
```

#### Key SQL Queries for Pipeline

1. **Get unverified inferences for review**
```sql
SELECT i.*, q.topic, q.context 
FROM inferences i
JOIN queries q ON i.query_id = q.id
WHERE i.verified_at IS NULL
ORDER BY i.created_at ASC
LIMIT 10;
```

2. **Calculate inference accuracy by angle**
```sql
SELECT 
  CASE 
    WHEN selected_inference = 'A' THEN 'conservative'
    WHEN selected_inference = 'B' THEN 'progressive'
    WHEN selected_inference = 'C' THEN 'synthetic'
  END as angle,
  COUNT(*) as total_selected,
  AVG(confidence_score) as avg_confidence,
  COUNT(CASE WHEN verification_correct = true THEN 1 END) as correct_count
FROM inferences
WHERE verified_at IS NOT NULL
GROUP BY selected_inference;
```

3. **Track user performance**
```sql
SELECT 
  u.id,
  u.username,
  COUNT(DISTINCT q.id) as total_queries,
  COUNT(DISTINCT i.id) as total_verifications,
  COUNT(CASE WHEN i.verification_correct = true THEN 1 END) as correct_verifications,
  ROUND(
    COUNT(CASE WHEN i.verification_correct = true THEN 1 END)::numeric / 
    NULLIF(COUNT(DISTINCT i.id), 0) * 100, 2
  ) as accuracy_percentage
FROM users u
LEFT JOIN queries q ON u.id = q.user_id
LEFT JOIN inferences i ON q.id = i.query_id AND i.verified_at IS NOT NULL
GROUP BY u.id, u.username;
```

### Database Optimization Strategies

1. **Indexing Strategy**
   - Primary keys: UUID with B-tree indexes
   - Foreign keys: Indexed for JOIN performance
   - Partial indexes for filtered queries (e.g., unverified inferences)
   - JSONB GIN indexes for evidence_links

2. **Query Optimization**
   ```sql
   -- Use CTEs for complex aggregations
   WITH user_stats AS (
     SELECT user_id, COUNT(*) as query_count
     FROM queries
     GROUP BY user_id
   )
   SELECT u.*, us.query_count
   FROM users u
   JOIN user_stats us ON u.id = us.user_id;
   ```

3. **Connection Pooling**
   - Pool size: 10 connections (configurable)
   - Idle timeout: 30 seconds
   - Connection timeout: 3 seconds

4. **Data Archival Strategy**
   ```sql
   -- Archive old verified inferences
   CREATE TABLE inferences_archive AS
   SELECT * FROM inferences 
   WHERE verified_at < NOW() - INTERVAL '90 days';
   
   -- Create partitioned tables for scale
   CREATE TABLE inferences_2024_q1 PARTITION OF inferences
   FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
   ```

## Performance Benchmarks

### Key Metrics to Track

1. **Response Time Targets**
   - API endpoints: < 200ms (p95)
   - Claude API calls: < 3s (p95)
   - Database queries: < 50ms (p95)

2. **Throughput Targets**
   - Concurrent users: 100
   - Requests per second: 50
   - Inference generation: 10/minute

3. **Database Performance**
   ```sql
   -- Monitor slow queries
   SELECT 
     query,
     calls,
     mean_exec_time,
     total_exec_time
   FROM pg_stat_statements
   WHERE mean_exec_time > 100
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

4. **Inference Quality Metrics**
   - Verification accuracy: > 80%
   - User agreement rate: > 70%
   - Confidence score correlation: > 0.6

### Performance Monitoring SQL

```sql
-- Daily inference generation stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as inferences_generated,
  COUNT(DISTINCT query_id) as unique_queries,
  AVG(confidence_score) as avg_confidence,
  COUNT(CASE WHEN verified_at IS NOT NULL THEN 1 END) as verified_count
FROM inferences
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- User engagement metrics
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_actions,
  COUNT(*) / COUNT(DISTINCT user_id)::numeric as actions_per_user
FROM (
  SELECT user_id, created_at FROM queries
  UNION ALL
  SELECT q.user_id, i.verified_at as created_at 
  FROM inferences i 
  JOIN queries q ON i.query_id = q.id 
  WHERE i.verified_at IS NOT NULL
) user_actions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);
```

## Inference Accuracy Improvement Methods

### 1. Prompt Engineering Optimization

**Current prompt structure** in `claude.service.ts`:
- Conservative: Focus on explicit evidence
- Progressive: Explore patterns and trends
- Synthetic: Bridge and reconcile perspectives

**Improvement strategies:**
```typescript
// Enhanced prompt with few-shot examples
const enhancedPrompt = `
${basePrompt}

Examples of high-quality inferences:
1. [Include verified high-scoring inferences]
2. [Include domain-specific examples]

Common pitfalls to avoid:
- Over-generalization without evidence
- Conflating correlation with causation
- Ignoring contradictory data
`;
```

### 2. Confidence Score Calibration

```typescript
// Improved confidence calculation
function calculateConfidence(inference: string, context: string): number {
  const factors = {
    evidenceCount: (inference.match(/evidence:/gi) || []).length,
    citationCount: (inference.match(/\[\d+\]/g) || []).length,
    specificityScore: calculateSpecificity(inference),
    contextAlignment: calculateContextAlignment(inference, context),
    lengthPenalty: Math.min(inference.length / 1000, 1)
  };
  
  const weights = {
    evidenceCount: 0.3,
    citationCount: 0.2,
    specificityScore: 0.25,
    contextAlignment: 0.2,
    lengthPenalty: 0.05
  };
  
  return Object.entries(factors).reduce(
    (score, [key, value]) => score + value * weights[key], 
    0
  );
}
```

### 3. Feedback Loop Implementation

```sql
-- Track inference performance by domain
CREATE VIEW inference_performance AS
SELECT 
  q.domain,
  i.data_type,
  COUNT(*) as total,
  AVG(CASE WHEN i.selected_inference = 'A' THEN 1 ELSE 0 END) as conservative_rate,
  AVG(CASE WHEN i.selected_inference = 'B' THEN 1 ELSE 0 END) as progressive_rate,
  AVG(CASE WHEN i.selected_inference = 'C' THEN 1 ELSE 0 END) as synthetic_rate,
  AVG(i.confidence_score) as avg_confidence,
  AVG(CASE WHEN i.verification_correct THEN 1 ELSE 0 END) as accuracy
FROM inferences i
JOIN queries q ON i.query_id = q.id
WHERE i.verified_at IS NOT NULL
GROUP BY q.domain, i.data_type;
```

### 4. A/B Testing Framework

```typescript
// A/B test different Claude models
interface InferenceExperiment {
  id: string;
  model: 'claude-3-sonnet' | 'claude-3-opus';
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

async function runInferenceExperiment(
  query: string,
  experiment: InferenceExperiment
): Promise<InferenceResult> {
  // Track experiment metrics
  const startTime = Date.now();
  const result = await generateInference(query, experiment);
  
  await trackExperiment({
    experimentId: experiment.id,
    duration: Date.now() - startTime,
    tokenCount: result.tokenCount,
    confidence: result.confidence
  });
  
  return result;
}
```

## Scalability Considerations

### 1. Database Scaling

**Vertical Scaling**
- Current: Single PostgreSQL instance
- Next: Increase CPU/RAM as needed
- Monitor: Connection count, query performance

**Horizontal Scaling**
```sql
-- Read replica setup
-- Primary for writes
-- Replicas for read-heavy operations (verification, stats)

-- Partition large tables
CREATE TABLE inferences_2024 PARTITION OF inferences
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 2. API Scaling

**Rate Limiting by Tier**
```typescript
const rateLimits = {
  free: { windowMs: 15 * 60 * 1000, max: 10 },
  basic: { windowMs: 15 * 60 * 1000, max: 50 },
  premium: { windowMs: 15 * 60 * 1000, max: 200 }
};
```

**Caching Strategy**
```typescript
// Redis caching for frequently accessed data
const cacheKeys = {
  userStats: (userId: string) => `stats:${userId}`,
  inferenceStats: () => 'stats:inferences:global',
  leaderboard: () => 'leaderboard:accuracy'
};

// Cache with TTL
await redis.setex(
  cacheKeys.userStats(userId),
  300, // 5 minutes
  JSON.stringify(stats)
);
```

### 3. Claude API Optimization

**Batch Processing**
```typescript
// Queue inference requests
interface InferenceJob {
  id: string;
  queryId: string;
  priority: 'high' | 'normal' | 'low';
  retries: number;
}

// Process in batches with priority
async function processInferenceQueue() {
  const jobs = await getQueuedJobs({ 
    limit: 10,
    orderBy: 'priority DESC, created_at ASC'
  });
  
  await Promise.all(
    jobs.map(job => processInferenceJob(job))
  );
}
```

**Cost Optimization**
```typescript
// Track token usage
CREATE TABLE token_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  model VARCHAR(50),
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMP DEFAULT NOW()
);

// Implement token budgets
const checkTokenBudget = async (userId: string): Promise<boolean> => {
  const usage = await getMonthlyTokenUsage(userId);
  const limit = await getUserTokenLimit(userId);
  return usage < limit;
};
```

## Development Workflow Best Practices

### 1. Git Workflow

**Branch Strategy**
```bash
main
├── develop
│   ├── feature/inference-optimization
│   ├── feature/dashboard-redesign
│   └── bugfix/confidence-calculation
└── release/v1.2.0
```

**Commit Convention**
```bash
# Format: <type>(<scope>): <subject>

feat(inference): add multi-model support
fix(auth): resolve JWT expiration issue
docs(api): update inference endpoint documentation
perf(db): optimize inference query performance
test(service): add Claude service unit tests
```

### 2. Code Review Checklist

- [ ] **Security**: No SQL injection, XSS, or sensitive data exposure
- [ ] **Performance**: Queries optimized, no N+1 problems
- [ ] **Error Handling**: Graceful failures, meaningful error messages
- [ ] **Type Safety**: TypeScript types properly defined
- [ ] **Documentation**: Code comments and API docs updated
- [ ] **Testing**: Unit tests for new functionality
- [ ] **Database**: Migrations included if schema changed

### 3. Development Tools

**VSCode Extensions**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "mtxr.sqltools",
    "bradlc.vscode-tailwindcss"
  ]
}
```

**Pre-commit Hooks**
```bash
# .husky/pre-commit
npm run lint
npm run type-check
npm run test:unit
```

## Testing Requirements

### 1. Unit Testing

**Backend Testing Structure**
```typescript
// Example: inference.service.test.ts
describe('InferenceService', () => {
  describe('generateInferences', () => {
    it('should generate three distinct inferences', async () => {
      const result = await service.generateInferences(mockQuery);
      expect(result).toHaveProperty('conservative');
      expect(result).toHaveProperty('progressive');
      expect(result).toHaveProperty('synthetic');
    });
    
    it('should calculate confidence scores between 0 and 1', async () => {
      const result = await service.generateInferences(mockQuery);
      expect(result.conservative.confidence).toBeGreaterThanOrEqual(0);
      expect(result.conservative.confidence).toBeLessThanOrEqual(1);
    });
  });
});
```

**Frontend Testing Structure**
```typescript
// Example: DashboardPage.test.tsx
describe('DashboardPage', () => {
  it('should display user stats', async () => {
    render(<DashboardPage />);
    expect(await screen.findByText(/Total Queries/)).toBeInTheDocument();
    expect(await screen.findByText(/Accuracy/)).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

```typescript
// API endpoint testing
describe('POST /api/queries', () => {
  it('should create query and generate inferences', async () => {
    const response = await request(app)
      .post('/api/queries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Test Query',
        context: 'Test context',
        dataType: '1st-party'
      });
      
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('query');
    expect(response.body.data).toHaveProperty('inferences');
  });
});
```

### 3. E2E Testing

```typescript
// Playwright example
test('complete inference verification flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Create query
  await page.goto('/query');
  await page.fill('[name="topic"]', 'E2E Test Query');
  await page.fill('[name="context"]', 'Test context');
  await page.click('button:has-text("Generate Inferences")');
  
  // Verify inference
  await page.waitForSelector('.inference-card');
  await page.click('input[value="A"]');
  await page.click('button:has-text("Verify")');
  
  expect(await page.textContent('.success-message')).toContain('Verified');
});
```

### 4. Performance Testing

```bash
# Load testing with k6
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  const response = http.get('http://localhost:3000/api/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Deployment Checklist

### Pre-deployment

- [ ] **Environment Variables**
  ```bash
  # Verify all required env vars
  NODE_ENV=production
  DATABASE_URL=postgresql://...
  DATABASE_SSL=true
  CLAUDE_API_KEY=sk-ant-...
  JWT_SECRET=<32+ character secret>
  CORS_ORIGIN=https://your-domain.com
  ```

- [ ] **Database Preparation**
  ```bash
  # Run migrations
  psql $DATABASE_URL -f database/schema.sql
  psql $DATABASE_URL -f database/migration_add_username.sql
  
  # Verify indexes
  psql $DATABASE_URL -c "\di"
  ```

- [ ] **Security Audit**
  ```bash
  # Check for vulnerabilities
  npm audit
  
  # Verify HTTPS only
  # Check CORS configuration
  # Validate rate limiting
  ```

### Deployment Steps

1. **Build Assets**
   ```bash
   npm run build
   ```

2. **Database Backup**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

3. **Deploy Backend**
   ```bash
   # Using PM2
   pm2 start backend/dist/index.js --name verified-inference-api
   
   # Using systemd
   sudo systemctl start verified-inference
   ```

4. **Deploy Frontend**
   ```bash
   # Upload to CDN/Static hosting
   aws s3 sync frontend/dist s3://your-bucket --delete
   aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
   ```

### Post-deployment

- [ ] **Health Checks**
  ```bash
  curl https://api.your-domain.com/health
  ```

- [ ] **Monitor Logs**
  ```bash
  tail -f backend/logs/error.log
  tail -f backend/logs/combined.log
  ```

- [ ] **Performance Verification**
  ```sql
  -- Check response times
  SELECT 
    endpoint,
    AVG(response_time) as avg_ms,
    MAX(response_time) as max_ms,
    COUNT(*) as requests
  FROM api_logs
  WHERE timestamp > NOW() - INTERVAL '1 hour'
  GROUP BY endpoint;
  ```

## Monitoring and Analytics Setup

### 1. Application Monitoring

**Key Metrics Dashboard**
```sql
CREATE VIEW monitoring_dashboard AS
SELECT 
  -- System Health
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  (SELECT COUNT(*) FROM queries WHERE created_at > NOW() - INTERVAL '24 hours') as queries_24h,
  (SELECT COUNT(*) FROM inferences WHERE created_at > NOW() - INTERVAL '24 hours') as inferences_24h,
  
  -- Performance
  (SELECT AVG(confidence_score) FROM inferences WHERE created_at > NOW() - INTERVAL '7 days') as avg_confidence_7d,
  (SELECT COUNT(*) FILTER (WHERE verification_correct = true) * 100.0 / COUNT(*) 
   FROM inferences WHERE verified_at > NOW() - INTERVAL '7 days') as accuracy_7d,
  
  -- User Engagement
  (SELECT COUNT(DISTINCT user_id) FROM queries WHERE created_at > NOW() - INTERVAL '7 days') as active_users_7d,
  (SELECT AVG(query_count) FROM (
    SELECT user_id, COUNT(*) as query_count 
    FROM queries 
    WHERE created_at > NOW() - INTERVAL '7 days' 
    GROUP BY user_id
  ) user_queries) as avg_queries_per_user_7d;
```

### 2. Error Tracking

```typescript
// Sentry integration
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 0.1,
});

// Custom error tracking
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  Sentry.captureException(err, {
    extra: {
      endpoint: req.path,
      method: req.method,
      userId: req.user?.id,
    },
  });
  next(err);
});
```

### 3. Business Analytics

```sql
-- Weekly cohort analysis
WITH cohort_data AS (
  SELECT 
    DATE_TRUNC('week', u.created_at) as cohort_week,
    u.id as user_id,
    DATE_TRUNC('week', q.created_at) as activity_week,
    COUNT(DISTINCT q.id) as queries
  FROM users u
  LEFT JOIN queries q ON u.id = q.user_id
  GROUP BY 1, 2, 3
)
SELECT 
  cohort_week,
  COUNT(DISTINCT user_id) as cohort_size,
  activity_week,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT user_id) * 100.0 / COUNT(DISTINCT user_id) OVER (PARTITION BY cohort_week) as retention_rate
FROM cohort_data
GROUP BY cohort_week, activity_week
ORDER BY cohort_week, activity_week;

-- Inference quality trends
SELECT 
  DATE_TRUNC('day', created_at) as date,
  data_type,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) as total_inferences,
  COUNT(CASE WHEN selected_inference IS NOT NULL THEN 1 END) as verified_count,
  AVG(CASE WHEN verification_correct THEN 1 ELSE 0 END) as accuracy_rate
FROM inferences
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date, data_type
ORDER BY date DESC;
```

### 4. Alerting Rules

```yaml
# Prometheus alerting rules
groups:
  - name: verified_inference_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: LowInferenceAccuracy
        expr: inference_accuracy_rate < 0.7
        for: 15m
        annotations:
          summary: "Inference accuracy below threshold"
          
      - alert: DatabaseConnectionPool
        expr: pg_connections_active / pg_connections_max > 0.8
        for: 5m
        annotations:
          summary: "Database connection pool near capacity"
```

## Continuous Improvement

### 1. A/B Testing Infrastructure

```typescript
// Feature flags for gradual rollout
interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage?: number;
  userGroups?: string[];
}

const features = {
  enhancedInferenceModel: {
    name: 'enhanced_inference_model',
    enabled: true,
    percentage: 50, // 50% of users
  },
  newConfidenceAlgorithm: {
    name: 'new_confidence_algorithm',
    enabled: true,
    userGroups: ['beta_testers'],
  },
};
```

### 2. Performance Optimization Queries

```sql
-- Identify slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Index usage analysis
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

### 3. Regular Maintenance Tasks

```bash
# Weekly database maintenance
#!/bin/bash
# maintenance.sh

# Vacuum analyze
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Update statistics
psql $DATABASE_URL -c "ANALYZE;"

# Clean up old logs
find ./logs -name "*.log" -mtime +30 -delete

# Archive old inferences
psql $DATABASE_URL -f scripts/archive_old_data.sql
```

## Security Best Practices

### 1. Regular Security Audits

```bash
# Dependency scanning
npm audit --production

# OWASP dependency check
dependency-check --project "verified-inference" --scan .

# Secret scanning
gitleaks detect --source . --verbose
```

### 2. Data Privacy Compliance

```sql
-- User data export (GDPR)
CREATE OR REPLACE FUNCTION export_user_data(user_id UUID)
RETURNS TABLE (
  table_name TEXT,
  data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'users', row_to_json(u.*)::jsonb FROM users u WHERE u.id = user_id
  UNION ALL
  SELECT 'queries', jsonb_agg(row_to_json(q.*)) FROM queries q WHERE q.user_id = user_id
  UNION ALL
  SELECT 'sessions', jsonb_agg(row_to_json(s.*)) FROM sessions s WHERE s.user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- User data deletion (Right to be forgotten)
CREATE OR REPLACE FUNCTION delete_user_data(user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM users WHERE id = user_id;
  -- Cascading deletes handle related data
END;
$$ LANGUAGE plpgsql;
```

## Conclusion

This development guide provides a comprehensive framework for contributing to and maintaining the Verified Inference system. Key focus areas:

1. **Performance**: Monitor query times, optimize database indexes, implement caching
2. **Accuracy**: Continuously improve inference quality through prompt engineering and feedback loops
3. **Security**: Regular audits, secure coding practices, data privacy compliance
4. **Scalability**: Database partitioning, API rate limiting, efficient resource usage
5. **Quality**: Comprehensive testing, code reviews, monitoring

For questions or suggestions, please refer to the issue tracker or contact the development team.