const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') || process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false
});

async function addDisputeDescriptionColumn() {
  const client = await pool.connect();
  try {
    console.log('🔄 Adding description column to disputes table...');

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'disputes' AND column_name = 'description'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ Description column already exists in disputes table');
      return;
    }

    // Add description column
    await client.query(`
      ALTER TABLE disputes 
      ADD COLUMN description TEXT
    `);

    console.log('✅ Successfully added description column to disputes table');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('✅ Description column already exists in disputes table');
    } else {
      console.error('❌ Error adding description column:', error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

addDisputeDescriptionColumn()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

