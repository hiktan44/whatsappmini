-- Migration: enable_rls_and_policies_all_tables
-- Created at: 1755638276

-- Enable RLS for all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;

DROP POLICY IF EXISTS "Users can view their own templates" ON message_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON message_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON message_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON message_templates;

DROP POLICY IF EXISTS "Users can view their own variables" ON custom_variables;
DROP POLICY IF EXISTS "Users can insert their own variables" ON custom_variables;
DROP POLICY IF EXISTS "Users can update their own variables" ON custom_variables;
DROP POLICY IF EXISTS "Users can delete their own variables" ON custom_variables;

DROP POLICY IF EXISTS "Users can view their own media" ON media_files;
DROP POLICY IF EXISTS "Users can insert their own media" ON media_files;
DROP POLICY IF EXISTS "Users can update their own media" ON media_files;
DROP POLICY IF EXISTS "Users can delete their own media" ON media_files;

DROP POLICY IF EXISTS "Users can view their own connections" ON whatsapp_connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON whatsapp_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON whatsapp_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON whatsapp_connections;

-- Create policies for CONTACTS table
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for MESSAGE_TEMPLATES table
CREATE POLICY "Users can view their own templates" ON message_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON message_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON message_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for CUSTOM_VARIABLES table
CREATE POLICY "Users can view their own variables" ON custom_variables
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own variables" ON custom_variables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variables" ON custom_variables
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variables" ON custom_variables
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for MEDIA_FILES table
CREATE POLICY "Users can view their own media" ON media_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media" ON media_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media" ON media_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media" ON media_files
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for WHATSAPP_CONNECTIONS table
CREATE POLICY "Users can view their own connections" ON whatsapp_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections" ON whatsapp_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON whatsapp_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON whatsapp_connections
  FOR DELETE USING (auth.uid() = user_id);;