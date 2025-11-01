import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Basic check to ensure environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL and Anon Key are missing. Make sure to set them in your .env.local file');
  // Optional: You could throw an error here to halt execution if keys are critical at startup
  // throw new Error('Supabase URL and Anon Key must be provided in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Optional: Log a message in development to confirm connection setup attempt
if (import.meta.env.DEV) {
  console.log('Supabase client initialized.');
}
