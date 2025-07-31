import { pool } from '../config/database';
import { logger } from '../utils/logger';

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle database client', err);
});

pool.on('connect', () => {
  logger.info('Database client connected');
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error });
    throw error;
  }
};

export const getClient = () => pool.connect();

export default pool;