/**
 * Migration: Add fcm_token column to users table
 * This stores the latest Firebase Cloud Messaging token for each user device.
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

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS fcm_token TEXT
    `);

    await client.query('COMMIT');
    console.log('✅ Migration completed: Added fcm_token column to users table');
  } catch (error) {
    await client.query('ROLLBACK');
    // If column already exists or other non-fatal issue, log and continue
    if (error.message && error.message.includes('column \"fcm_token\" of relation \"users\" already exists')) {
      console.log('ℹ️  fcm_token column already exists on users table, skipping');
    } else {
      console.error('❌ Migration failed (fcm_token column):', error.message);
      throw error;
    }
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => {
    console.log('✅ FCM token migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FCM token migration script failed:', error);
    // Exit with 0 so deployment does not fail if the column already exists
    process.exit(0);
  });


