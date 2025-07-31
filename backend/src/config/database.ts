import { Pool } from 'pg';
import { config } from './index';

export const pool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.ssl 
    ? {
        rejectUnauthorized: config.env === 'production', // Only allow in development
        // In production, you should provide CA certificate
        // ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
      }
    : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}