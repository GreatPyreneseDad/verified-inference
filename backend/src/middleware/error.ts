import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Sanitize request body to remove sensitive fields
const sanitizeRequestBody = (body: any): any => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization', 'creditCard', 'ssn'];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Sanitize query parameters
const sanitizeQueryParams = (query: any): any => {
  if (!query || typeof query !== 'object') return query;
  
  const sanitized = { ...query };
  const sensitiveParams = ['token', 'apiKey', 'secret', 'password'];
  
  sensitiveParams.forEach(param => {
    if (param in sanitized) {
      sanitized[param] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err } as any;
  error.message = err.message;

  // Log error without sensitive data
  logger.error({
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      // Sanitize request body to exclude sensitive fields
      body: sanitizeRequestBody(req.body),
      params: req.params,
      // Exclude potentially sensitive query params
      query: sanitizeQueryParams(req.query),
    },
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).join(', ');
    error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};