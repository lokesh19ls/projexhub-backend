import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️  Supabase credentials not configured!');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Test connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist yet
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// Helper function to execute raw SQL queries (if needed)
export const executeSQL = async (query: string, params?: any[]) => {
  try {
    // Note: Supabase doesn't support raw SQL queries via the client
    // You'll need to use the REST API or create database functions
    // For now, we'll use the Supabase client methods
    console.warn('Raw SQL queries not supported via Supabase client. Use Supabase client methods instead.');
    return null;
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
};

export default supabase;

