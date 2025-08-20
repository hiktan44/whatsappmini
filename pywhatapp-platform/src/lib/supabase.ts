export { supabase } from '../supabaseClient'

// Database types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'user' | 'admin';
  subscription_plan: 'free' | 'pro' | 'enterprise';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  content: string;
  variables: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name?: string;
  phone: string;
  email?: string;
  tags: string[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactGroup {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  template_id?: string;
  status: 'draft' | 'running' | 'completed' | 'paused' | 'failed';
  total_contacts: number;
  sent_count: number;
  failed_count: number;
  scheduled_time?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  mime_type?: string;
  thumbnail_url?: string;
  is_compressed: boolean;
  created_at: string;
}

export interface CustomVariable {
  id: string;
  user_id: string;
  variable_name: string;
  variable_value: string;
  description?: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}
