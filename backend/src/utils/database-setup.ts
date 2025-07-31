import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../db/pool';
import { logger } from './logger';

export async function setupDatabase(): Promise<void> {
  try {
    // Check if tables exist
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      logger.info('Database tables already exist');
      return;
    }

    logger.info('Setting up database tables...');

    // Read and execute the setup SQL
    const setupSQL = readFileSync(
      join(__dirname, '../../database/complete_setup.sql'),
      'utf-8'
    );

    // Split by semicolon and execute each statement
    const statements = setupSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await pool.query(statement + ';');
      } catch (error: any) {
        // Ignore certain errors like "already exists"
        if (!error.message.includes('already exists')) {
          logger.error('Error executing statement:', error.message);
        }
      }
    }

    // Run migration
    const migrationSQL = readFileSync(
      join(__dirname, '../../database/migration_add_coherence_metrics.sql'),
      'utf-8'
    );

    const migrationStatements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of migrationStatements) {
      try {
        await pool.query(statement + ';');
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          logger.error('Error executing migration:', error.message);
        }
      }
    }

    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Failed to setup database:', error);
    // Don't throw - let the app continue anyway
  }
}