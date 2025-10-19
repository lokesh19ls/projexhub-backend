import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Supabase connection configuration
const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10 seconds for Supabase
  ssl: process.env.DB_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected database error:', err);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connection verified');
  })
  .catch((err) => {
    console.warn('⚠️  Database connection failed. Some features may not work.');
    console.warn('⚠️  Error:', err.message);
    console.warn('⚠️  Please ensure PostgreSQL is running and credentials are correct.');
  });

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export const getClient = async () => {
  const client = await pool.connect();
  const release = client.release.bind(client);
  
  // Set a timeout of 5 seconds
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  client.release = () => {
    clearTimeout(timeout);
    return release();
  };
  
  return client;
};

export default pool;

