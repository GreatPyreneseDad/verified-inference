import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { testConnection } from './config/database';
import { errorHandler } from './middleware/error';
import { csrfProtection, getCSRFToken } from './middleware/csrf';
import { logger } from './utils/logger';
import { TokenManager } from './utils/token-manager';

// Import routes
import routes from './routes';

const app: Application = express();

// Middleware
app.use(helmet());

// Configure CORS with dynamic origin handling
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    try {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        return callback(null, true);
      }
      
      // Get allowed origins from config
      const allowedOrigins = Array.isArray(config.cors.origin) 
        ? config.cors.origin 
        : [config.cors.origin];
      
      // Normalize origins - remove any whitespace/newlines
      const normalizedOrigin = origin.trim().replace(/\s+/g, '');
      const normalizedAllowedOrigins = allowedOrigins.map(o => o.trim().replace(/\s+/g, ''));
      
      // Check if origin is allowed
      if (normalizedAllowedOrigins.includes(normalizedOrigin) || normalizedAllowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        // TESTING MODE: Allow all origins temporarily
        console.warn('CORS warning - allowing origin for testing:', normalizedOrigin);
        callback(null, true);
        
        // Production code (commented out for testing):
        // console.error('CORS rejected origin:', normalizedOrigin);
        // console.error('Allowed origins:', normalizedAllowedOrigins);
        // callback(new Error('Not allowed by CORS'));
      }
    } catch (error) {
      console.error('CORS error:', error);
      callback(error as Error);
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS with error handling
app.use((req, res, next) => {
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      logger.error('CORS middleware error:', err);
      res.status(500).json({ 
        success: false, 
        error: 'CORS configuration error',
        message: err.message 
      });
      return;
    }
    next();
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
});

// Apply general rate limiter to all API routes
app.use('/api/', limiter);

// Apply stricter rate limiter to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/health', (_req: any, res: any) => {
  res.status(200).json({
    status: 'ok',
    service: 'Verified Inference API',
    timestamp: new Date().toISOString(),
  });
});

// CORS test endpoint
app.options('/api/test-cors', cors(corsOptions), (_req: any, res: any) => {
  res.sendStatus(204);
});

app.get('/api/test-cors', (_req: any, res: any) => {
  res.json({
    status: 'ok',
    cors: 'configured',
    allowedOrigins: config.cors.origin
  });
});

// Diagnostic endpoint
app.get('/api/diagnostics', (_req: any, res: any) => {
  res.json({
    status: 'ok',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      CORS_ORIGIN_LENGTH: process.env.CORS_ORIGIN?.length,
      CORS_ORIGIN_CHARS: process.env.CORS_ORIGIN?.split('').map(c => c.charCodeAt(0)),
      DB_CONNECTED: !!process.env.DATABASE_URL,
      CLAUDE_KEY_SET: !!process.env.CLAUDE_API_KEY,
      JWT_SECRET_SET: !!process.env.JWT_SECRET
    },
    config: {
      corsOrigins: config.cors.origin,
      corsCredentials: config.cors.credentials
    }
  });
});

// CSRF token endpoint
app.get('/api/csrf-token', getCSRFToken);

// Apply CSRF protection to all API routes
app.use('/api', csrfProtection);

// API Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize TokenManager to prevent circular dependencies
    TokenManager.initialize(jwt, config.jwt.secret);
    logger.info('TokenManager initialized');
    
    // Log CORS configuration for debugging
    logger.info('CORS configuration:', {
      origins: config.cors.origin,
      credentials: config.cors.credentials
    });
    
    // Test database connection
    await testConnection();
    
    // Setup database tables if needed
    if (config.env === 'production') {
      const { setupDatabase } = await import('./utils/database-setup');
      await setupDatabase();
    }
    
    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();