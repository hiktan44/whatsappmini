import { createClient } from '@supabase/supabase-js'

// Supabase environment variables with fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://alaxtcfutcfgiqchbuwe.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsYXh0Y2Z1dGNmZ2lxY2hidXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTkwNTAsImV4cCI6MjA3MTEzNTA1MH0.7l6tV2co8RBmh3qdwvF5tQJkfDcdWL_ceFirrWXGmdI'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Tek Supabase client instance (singleton pattern)
// Bu, Multiple GoTrueClient instances uyarısını önler
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export default supabase
