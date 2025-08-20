import { supabase } from '../supabaseClient'

// Types
export interface Contact {
  id: string
  user_id: string
  name: string
  phone_number: string
  group_id?: string
  created_at: string
}

export interface ContactGroup {
  id: string
  user_id: string
  group_name: string
  description?: string
  created_at: string
}

export interface MessageTemplate {
  id: string
  user_id: string
  template_name: string
  content: string
  variables?: string[]
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  template_id: string
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduled_time?: string
  created_at: string
}

export interface MediaFile {
  id: string
  user_id: string
  file_name: string
  file_type: string
  file_url: string
  file_size: number
  created_at: string
}

export interface CustomVariable {
  id: string
  user_id: string
  variable_name: string
  variable_value: string
  created_at: string
}

// API Functions
export class ApiService {
  
  // Authentication
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Contacts Management
  static async getContacts(userId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contact])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Contact Groups
  static async getContactGroups(userId: string): Promise<ContactGroup[]> {
    const { data, error } = await supabase
      .from('contact_groups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createContactGroup(group: Omit<ContactGroup, 'id' | 'created_at'>): Promise<ContactGroup> {
    const { data, error } = await supabase
      .from('contact_groups')
      .insert([group])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Message Templates
  static async getMessageTemplates(userId: string): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createMessageTemplate(template: Omit<MessageTemplate, 'id' | 'created_at'>): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('message_templates')
      .insert([template])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateMessageTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const { data, error } = await supabase
      .from('message_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteMessageTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Custom Variables
  static async getCustomVariables(userId: string): Promise<CustomVariable[]> {
    const { data, error } = await supabase
      .from('custom_variables')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createCustomVariable(variable: Omit<CustomVariable, 'id' | 'created_at'>): Promise<CustomVariable> {
    const { data, error } = await supabase
      .from('custom_variables')
      .insert([variable])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateCustomVariable(id: string, updates: Partial<CustomVariable>): Promise<CustomVariable> {
    const { data, error } = await supabase
      .from('custom_variables')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteCustomVariable(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_variables')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Media Files
  static async uploadMediaFile(file: File, userId: string): Promise<MediaFile> {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-files')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-files')
      .getPublicUrl(fileName)

    // Save file info to database
    const mediaFile = {
      user_id: userId,
      file_name: file.name,
      file_type: file.type,
      file_url: publicUrl,
      file_size: file.size
    }

    const { data, error } = await supabase
      .from('media_files')
      .insert([mediaFile])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getMediaFiles(userId: string): Promise<MediaFile[]> {
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async deleteMediaFile(id: string, fileName: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('media-files')
      .remove([fileName])
    
    if (storageError) throw storageError

    // Delete from database
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Campaigns
  static async getCampaigns(userId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaign])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Edge Functions
  static async sendWhatsAppMessage(payload: {
    contacts: string[], // phone numbers
    message: string,
    mediaUrl?: string,
    variables?: Record<string, string>
  }) {
    const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: payload
    })
    
    if (error) throw error
    return data
  }

  static async sendBulkMessages(payload: {
    campaignId: string,
    contacts: Contact[],
    template: MessageTemplate,
    mediaFiles?: MediaFile[],
    variables?: CustomVariable[]
  }) {
    const { data, error } = await supabase.functions.invoke('send-bulk-messages', {
      body: payload
    })
    
    if (error) throw error
    return data
  }

  static async processMediaFile(payload: {
    fileUrl: string,
    fileType: string
  }) {
    const { data, error } = await supabase.functions.invoke('process-media-file', {
      body: payload
    })
    
    if (error) throw error
    return data
  }

  static async scheduleMessages(payload: {
    campaignId: string,
    scheduledTime: string
  }) {
    const { data, error } = await supabase.functions.invoke('schedule-messages', {
      body: payload
    })
    
    if (error) throw error
    return data
  }

  // Analytics
  static async getCampaignAnalytics(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_logs')
      .select('*')
      .eq('campaign_id', campaignId)
    
    if (error) throw error
    return data || []
  }

  static async getDashboardStats(userId: string) {
    // Get counts for dashboard cards
    const [contactsResult, templatesResult, campaignsResult] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('message_templates').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('campaigns').select('id', { count: 'exact' }).eq('user_id', userId)
    ])

    return {
      totalContacts: contactsResult.count || 0,
      totalTemplates: templatesResult.count || 0,
      totalCampaigns: campaignsResult.count || 0
    }
  }
}

export default ApiService