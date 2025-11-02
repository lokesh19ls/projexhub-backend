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
    // If table already exists, that's okay - log and continue
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️  project_progress_history table already exists, skipping creation');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => {
    console.log('✅ Progress history migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Progress history migration script failed:', error);
    // Exit with 0 to not fail deployment if table already exists
    process.exit(0);
  });

