const { createClient } = require('@supabase/supabase-js');

// Prefer backend-specific env vars, but fall back to NEXT_PUBLIC_* if provided
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) in your .env file.'
  );
}

// Create a single Supabase client instance for the whole backend
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = { supabase };


