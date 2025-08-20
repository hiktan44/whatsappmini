import { createClient } from '@supabase/supabase-js'

// Supabase konfigürasyonu
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Tek Supabase client instance (singleton pattern)
export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
