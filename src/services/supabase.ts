import { createClient } from '@supabase/supabase-js';
import { env } from '@/utils/env';

/**
 * Supabase client instance
 * Uses environment variables for configuration
 */
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  }
);

/**
 * Create a Supabase client with Clerk authentication
 * @param token JWT token from Clerk
 * @returns Supabase client with authentication
 */
export function createAuthClient(token: string) {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}

/**
 * Type-safe database query helper
 * @param callback Function that uses the supabase client
 * @returns Result of the callback function
 */
export async function withSupabase<T>(
  callback: (client: typeof supabase) => Promise<T>
): Promise<T> {
  try {
    return await callback(supabase);
  } catch (error) {
    console.error('Supabase error:', error);
    throw error;
  }
}

export default supabase; 