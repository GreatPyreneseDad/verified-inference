import { logger } from './logger';

interface TokenVerificationResult {
  valid: boolean;
  expired: boolean;
  payload?: any;
}

/**
 * TokenManager provides centralized token operations to prevent circular dependencies
 * between auth middleware and services that need token validation.
 * 
 * This utility acts as a dependency injection point, breaking the circular
 * reference pattern identified by the Pattern Analysis Agent.
 */
export class TokenManager {
  private static jwtLibrary: any;
  private static jwtSecret: string;

  /**
   * Initialize the TokenManager with JWT configuration
   * Must be called during application startup
   */
  static initialize(jwtLibrary: any, jwtSecret: string): void {
    if (!jwtLibrary || !jwtSecret) {
      throw new Error('TokenManager requires both JWT library and secret for initialization');
    }
    
    this.jwtLibrary = jwtLibrary;
    this.jwtSecret = jwtSecret;
    
    logger.info('TokenManager initialized successfully');
  }

  /**
   * Verify a JWT token without creating circular dependencies
   * @param token - The JWT token to verify
   * @returns Verification result with validity status and payload
   */
  static verifyToken(token: string): TokenVerificationResult {
    if (!this.jwtLibrary || !this.jwtSecret) {
      throw new Error('TokenManager not initialized. Call initialize() first.');
    }

    if (!token) {
      return { valid: false, expired: false };
    }

    try {
      const payload = this.jwtLibrary.verify(token, this.jwtSecret);
      return {
        valid: true,
        expired: false,
        payload
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, expired: true };
      }
      
      logger.error('Token verification failed:', error);
      return { valid: false, expired: false };
    }
  }

  /**
   * Generate a new JWT token
   * @param payload - The payload to encode in the token
   * @param expiresIn - Token expiration time (default: '24h')
   * @returns The generated JWT token
   */
  static generateToken(payload: any, expiresIn: string = '24h'): string {
    if (!this.jwtLibrary || !this.jwtSecret) {
      throw new Error('TokenManager not initialized. Call initialize() first.');
    }

    return this.jwtLibrary.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - The Authorization header value
   * @returns The extracted token or null
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7);
  }

  /**
   * Decode token without verification (useful for expired tokens)
   * @param token - The JWT token to decode
   * @returns The decoded payload or null
   */
  static decodeToken(token: string): any | null {
    if (!this.jwtLibrary) {
      throw new Error('TokenManager not initialized. Call initialize() first.');
    }

    try {
      return this.jwtLibrary.decode(token);
    } catch (error) {
      logger.error('Token decode failed:', error);
      return null;
    }
  }
}