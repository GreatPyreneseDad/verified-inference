import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool';
import { AppError } from '../middleware/error';
import { config } from '../config';
import { TokenManager } from '../utils/token-manager';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  total_queries: number;
  total_verifications: number;
  correct_verifications: number;
  created_at: Date;
}

export class UserModel {
  static async create(
    email: string,
    username: string,
    password: string
  ): Promise<User> {
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email or username already exists', 400);
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (id, email, username, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, email, username, passwordHash]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async verifyPassword(
    user: User,
    password: string
  ): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  static generateToken(user: User): string {
    // Ensure JWT secret is strong enough
    if (config.jwt.secret && config.jwt.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    const payload = {
      id: user.id,
      email: user.email,
      // Add token version for revocation capability
      tokenVersion: 1,
      // Add issued at time
      iat: Math.floor(Date.now() / 1000),
      // Add JWT ID for tracking
      jti: uuidv4(),
    };

    return TokenManager.generateToken(payload, config.jwt.expiresIn);
  }

  static async updateStats(
    userId: string,
    field: 'total_queries' | 'total_verifications' | 'correct_verifications'
  ): Promise<void> {
    // Use parameterized query to prevent SQL injection
    const validFields = ['total_queries', 'total_verifications', 'correct_verifications'];
    if (!validFields.includes(field)) {
      throw new AppError('Invalid field name', 400);
    }
    
    // Safe query with validated field name
    const queryText = `UPDATE users SET ${field} = ${field} + 1 WHERE id = $1`;
    await query(queryText, [userId]);
  }
}