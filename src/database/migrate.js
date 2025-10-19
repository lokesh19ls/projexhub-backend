const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  console.log('🔄 Starting database migration...');
  
  // Get connection string from environment
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  });
  
  try {
    // Read schema file - try multiple possible locations
    let schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      // Try src directory
      schemaPath = path.join(__dirname, '..', 'src', 'database', 'schema.sql');
    }
    if (!fs.existsSync(schemaPath)) {
      // Try root directory
      schemaPath = path.join(__dirname, '..', '..', 'src', 'database', 'schema.sql');
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database migration completed successfully!');
    console.log('📊 All tables created');
    
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified:', result.rows[0].now);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

