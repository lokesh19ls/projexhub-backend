/**
 * Migration: Create project_progress_history table
 * This table stores the history of project progress updates
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create project_progress_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_progress_history (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        updated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        progress_percentage INTEGER NOT NULL CHECK (progress_percentage IN (0, 20, 50, 100)),
        status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'completed')),
        progress_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_progress_history_project_id 
      ON project_progress_history(project_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_progress_history_created_at 
      ON project_progress_history(created_at)
    `);
    
    await client.query('COMMIT');
    console.log('✅ Migration completed: Created project_progress_history table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    // Don't throw error if table already exists
    if (!error.message.includes('already exists')) {
      throw error;
    }
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

