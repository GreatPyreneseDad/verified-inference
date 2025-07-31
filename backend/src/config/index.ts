import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    ssl: process.env.DATABASE_SSL === 'true',
  },
  
  // Claude API
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: 'claude-3-sonnet-20240229', // or claude-3-opus-20240229 for better quality
    maxTokens: 4096,
  },
  
  // Security
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Reduced from 7d to 1h
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256' as const,
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required configuration
const requiredEnvVars = [
  'DATABASE_URL',
  'CLAUDE_API_KEY',
  'JWT_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}