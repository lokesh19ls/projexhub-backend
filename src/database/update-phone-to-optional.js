const { Pool } = require('pg');

async function updatePhoneToOptional() {
  console.log('🔄 Updating phone column to be optional...');
  
  // Get connection string from environment
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // Alter phone column to allow NULL
    await pool.query(`ALTER TABLE users ALTER COLUMN phone DROP NOT NULL`);
    console.log('✅ Phone column updated to be optional');
    
    // Drop the unique constraint on phone if it exists
    try {
      await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key`);
      console.log('✅ Removed unique constraint on phone');
    } catch (error) {
      console.log('⚠️  No unique constraint to remove on phone');
    }
    
    await pool.end();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updatePhoneToOptional();

