import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool';

export interface Query {
  id: string;
  user_id: string;
  topic: string;
  context: string;
  metadata?: any;
  created_at: Date;
}

export class QueryModel {
  static async create(
    userId: string,
    topic: string,
    context: string,
    metadata?: any
  ): Promise<Query> {
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO queries (id, user_id, topic, context, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, userId, topic, context, metadata || {}]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<Query | null> {
    const result = await query('SELECT * FROM queries WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Query[]> {
    const result = await query(
      `SELECT * FROM queries 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return result.rows;
  }

  static async countByUserId(userId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) FROM queries WHERE user_id = $1',
      [userId]
    );
    
    return parseInt(result.rows[0].count, 10);
  }
}