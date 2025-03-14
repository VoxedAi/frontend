import { z } from 'zod';

/**
 * Environment variables schema with validation
 */
const envSchema = z.object({
  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  
  // Supabase Database
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  
  // App Configuration
  MODE: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Type-safe environment variables
 */
export const env = {
  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  
  // Supabase Database
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // App Configuration
  MODE: import.meta.env.MODE,
  
  // Base URLs
  BASE_URL: import.meta.env.MODE === 'production' 
    ? 'https://app.voxed.ai' 
    : 'http://localhost:5173',
} as const;

/**
 * Validate environment variables
 * This will throw an error if any required variables are missing
 */
try {
  envSchema.parse(env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(e => e.path.join('.'));
    console.error('❌ Missing or invalid environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  throw error;
}

export default env; 