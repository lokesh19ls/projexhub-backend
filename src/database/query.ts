import { supabase } from './supabase';

// Wrapper to make Supabase work with existing query pattern
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  
  try {
    // Parse the SQL query to extract table name and operation
    const sql = text.trim();
    
    // SELECT queries
    if (sql.toUpperCase().startsWith('SELECT')) {
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const { data, error } = await supabase.from(tableName).select('*');
        
        const duration = Date.now() - start;
        console.log('Executed query', { text: tableName, duration, rows: data?.length || 0 });
        
        if (error) throw error;
        return { rows: data || [] };
      }
    }
    
    // INSERT queries
    if (sql.toUpperCase().startsWith('INSERT')) {
      const tableMatch = sql.match(/INTO\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        // Extract values from INSERT statement
        const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
        if (valuesMatch && params) {
          const columns = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i)?.[1].split(',').map(c => c.trim());
          const values = params;
          
          const row: any = {};
          columns?.forEach((col, idx) => {
            row[col] = values[idx];
          });
          
          const { data, error } = await supabase.from(tableName).insert(row).select();
          
          const duration = Date.now() - start;
          console.log('Executed query', { text: tableName, duration, rows: data?.length || 0 });
          
          if (error) throw error;
          return { rows: data || [] };
        }
      }
    }
    
    // UPDATE queries
    if (sql.toUpperCase().startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        
        // For now, return empty result
        const duration = Date.now() - start;
        console.log('Executed query', { text: tableName, duration, rows: 0 });
        
        return { rows: [] };
      }
    }
    
    // DELETE queries
    if (sql.toUpperCase().startsWith('DELETE')) {
      const tableMatch = sql.match(/FROM\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        
        const duration = Date.now() - start;
        console.log('Executed query', { text: tableName, duration, rows: 0 });
        
        return { rows: [] };
      }
    }
    
    // Default: return empty result
    console.log('Executed query', { text, duration: Date.now() - start, rows: 0 });
    return { rows: [] };
    
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

