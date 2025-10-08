import { createClient } from '@supabase/supabase-js';

// Lazy initialization function
function initializeSupabase() {
  // Try to load dotenv if not already loaded
  if (!process.env.SUPABASE_URL) {
    try {
      require('dotenv').config();
    } catch (error) {
      // dotenv might not be available in all environments
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
  }

  return {
    supabaseAdmin: createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    supabase: createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    supabaseUrl,
    supabaseAnonKey
  };
}

// Lazy-loaded clients
let _clients: ReturnType<typeof initializeSupabase> | null = null;

function getClients() {
  if (!_clients) {
    _clients = initializeSupabase();
  }
  return _clients;
}

// Export lazy-loaded clients
export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    return getClients().supabaseAdmin[prop];
  }
});

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    return getClients().supabase[prop];
  }
});

// Database configuration
export const dbConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  queryTimeout: 30000,
};

// Helper function to retry database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = dbConfig.maxRetries,
  delay = dbConfig.retryDelay
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error && typeof error === 'object' && 'code' in error) {
        const pgError = error as { code: string };
        // Don't retry on syntax errors, constraint violations, etc.
        if (['42P01', '23505', '23514', '42703'].includes(pgError.code)) {
          throw error;
        }
      }
      
      if (attempt === maxRetries) {
        break;
      }
      
      console.log(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Helper function for authenticated operations
export function createAuthenticatedClient(userToken?: string) {
  if (!userToken) {
    return supabase;
  }
  
  const { supabaseUrl, supabaseAnonKey } = getClients();
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    },
  });
}

// Health check function
export async function checkSupabaseConnection(): Promise<{ 
  status: 'healthy' | 'unhealthy'; 
  message: string; 
  latency?: number;
}> {
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    const latency = Date.now() - start;
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine for health check
      throw error;
    }
    
    return {
      status: 'healthy',
      message: 'Supabase connection successful',
      latency,
    };
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
