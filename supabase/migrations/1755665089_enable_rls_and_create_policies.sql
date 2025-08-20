-- Migration: enable_rls_and_create_policies
-- Created at: 1755665089

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_business_api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for contacts table
CREATE POLICY "Users can manage own contacts" ON contacts FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for contact_groups table
CREATE POLICY "Users can manage own contact groups" ON contact_groups FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for contact_group_members table
CREATE POLICY "Users can manage own group members" ON contact_group_members FOR ALL USING (
  EXISTS (SELECT 1 FROM contact_groups WHERE id = group_id AND auth.uid()::text = user_id::text)
);

-- Create policies for message_templates table
CREATE POLICY "Users can manage own templates" ON message_templates FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for custom_variables table
CREATE POLICY "Users can manage own variables" ON custom_variables FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for media_files table
CREATE POLICY "Users can manage own media" ON media_files FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for whatsapp_connections table
CREATE POLICY "Users can manage own whatsapp connections" ON whatsapp_connections FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for whatsapp_business_api_settings table
CREATE POLICY "Users can manage own api settings" ON whatsapp_business_api_settings FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for campaigns table
CREATE POLICY "Users can manage own campaigns" ON campaigns FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for campaign_logs table
CREATE POLICY "Users can view own campaign logs" ON campaign_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND auth.uid()::text = user_id::text)
);

-- Create policies for message_logs table
CREATE POLICY "Users can manage own message logs" ON message_logs FOR ALL USING (auth.uid()::text = user_id::text);

-- Create policies for system_settings table
CREATE POLICY "Users can manage own settings" ON system_settings FOR ALL USING (auth.uid()::text = user_id::text);;