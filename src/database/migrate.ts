import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './connection';

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    
    await pool.query(schema);
    
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

