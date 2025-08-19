import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { ApiService, Contact, MessageTemplate, CustomVariable, MediaFile, Campaign } from '../services/api'
import { toast } from 'react-hot-toast'

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Get current user
  const getCurrentUser = async () => {
    try {
      const user = await ApiService.getCurrentUser()
      setUser(user)
      return user
    } catch (error: any) {
      console.error('Error getting user:', error)
      toast.error('Kullanıcı bilgileri alınırken hata oluştu')
      return null
    }
  }

  useEffect(() => {
    getCurrentUser()
  }, [])

  return {
    user,
    loading,
    setLoading,
    getCurrentUser
  }
}

export const useContacts = (userId: string | null) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)

  const fetchContacts = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const data = await ApiService.getContacts(userId)
      setContacts(data)
    } catch (error: any) {
      console.error('Error fetching contacts:', error)
      toast.error('Kişiler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const addContact = async (contactData: Omit<Contact, 'id' | 'created_at'>) => {
    setLoading(true)
    try {
      const newContact = await ApiService.createContact(contactData)
      setContacts(prev => [newContact, ...prev])
      toast.success('Kişi başarıyla eklendi')
      return newContact
    } catch (error: any) {
      console.error('Error adding contact:', error)
      toast.error('Kişi eklenirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    setLoading(true)
    try {
      const updatedContact = await ApiService.updateContact(id, updates)
      setContacts(prev => prev.map(c => c.id === id ? updatedContact : c))
      toast.success('Kişi başarıyla güncellendi')
      return updatedContact
    } catch (error: any) {
      console.error('Error updating contact:', error)
      toast.error('Kişi güncellenirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteContact = async (id: string) => {
    setLoading(true)
    try {
      await ApiService.deleteContact(id)
      setContacts(prev => prev.filter(c => c.id !== id))
      toast.success('Kişi başarıyla silindi')
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      toast.error('Kişi silinirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [userId])

  return {
    contacts,
    loading,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact
  }
}

export const useTemplates = (userId: string | null) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTemplates = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const data = await ApiService.getMessageTemplates(userId)
      setTemplates(data)
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      toast.error('Şablonlar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const addTemplate = async (templateData: Omit<MessageTemplate, 'id' | 'created_at'>) => {
    setLoading(true)
    try {
      const newTemplate = await ApiService.createMessageTemplate(templateData)
      setTemplates(prev => [newTemplate, ...prev])
      toast.success('Şablon başarıyla eklendi')
      return newTemplate
    } catch (error: any) {
      console.error('Error adding template:', error)
      toast.error('Şablon eklenirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    setLoading(true)
    try {
      const updatedTemplate = await ApiService.updateMessageTemplate(id, updates)
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t))
      toast.success('Şablon başarıyla güncellendi')
      return updatedTemplate
    } catch (error: any) {
      console.error('Error updating template:', error)
      toast.error('Şablon güncellenirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (id: string) => {
    setLoading(true)
    try {
      await ApiService.deleteMessageTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Şablon başarıyla silindi')
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error('Şablon silinirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [userId])

  return {
    templates,
    loading,
    fetchTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate
  }
}

export const useVariables = (userId: string | null) => {
  const [variables, setVariables] = useState<CustomVariable[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVariables = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const data = await ApiService.getCustomVariables(userId)
      setVariables(data)
    } catch (error: any) {
      console.error('Error fetching variables:', error)
      toast.error('Değişkenler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const addVariable = async (variableData: Omit<CustomVariable, 'id' | 'created_at'>) => {
    setLoading(true)
    try {
      const newVariable = await ApiService.createCustomVariable(variableData)
      setVariables(prev => [newVariable, ...prev])
      toast.success('Değişken başarıyla eklendi')
      return newVariable
    } catch (error: any) {
      console.error('Error adding variable:', error)
      toast.error('Değişken eklenirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVariables()
  }, [userId])

  return {
    variables,
    loading,
    fetchVariables,
    addVariable
  }
}

export const useMediaFiles = (userId: string | null) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchMediaFiles = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const data = await ApiService.getMediaFiles(userId)
      setMediaFiles(data)
    } catch (error: any) {
      console.error('Error fetching media files:', error)
      toast.error('Medya dosyaları yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File) => {
    if (!userId) throw new Error('User not found')
    
    setUploading(true)
    try {
      const mediaFile = await ApiService.uploadMediaFile(file, userId)
      setMediaFiles(prev => [mediaFile, ...prev])
      toast.success('Dosya başarıyla yüklendi')
      return mediaFile
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error('Dosya yüklenirken hata oluştu')
      throw error
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (id: string, fileName: string) => {
    setLoading(true)
    try {
      await ApiService.deleteMediaFile(id, fileName)
      setMediaFiles(prev => prev.filter(f => f.id !== id))
      toast.success('Dosya başarıyla silindi')
    } catch (error: any) {
      console.error('Error deleting file:', error)
      toast.error('Dosya silinirken hata oluştu')
      throw error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMediaFiles()
  }, [userId])

  return {
    mediaFiles,
    loading,
    uploading,
    fetchMediaFiles,
    uploadFile,
    deleteFile
  }
}

export const useWhatsApp = () => {
  const [sending, setSending] = useState(false)

  const sendMessage = async (payload: {
    contacts: string[],
    message: string,
    mediaUrl?: string,
    variables?: Record<string, string>
  }) => {
    setSending(true)
    try {
      const result = await ApiService.sendWhatsAppMessage(payload)
      toast.success(`Mesaj ${payload.contacts.length} kişiye başarıyla gönderildi`)
      return result
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error('Mesaj gönderilirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
      throw error
    } finally {
      setSending(false)
    }
  }

  const sendBulkMessages = async (payload: {
    campaignId: string,
    contacts: Contact[],
    template: MessageTemplate,
    mediaFiles?: MediaFile[],
    variables?: CustomVariable[]
  }) => {
    setSending(true)
    try {
      const result = await ApiService.sendBulkMessages(payload)
      toast.success(`Toplu mesaj ${payload.contacts.length} kişiye başarıyla gönderildi`)
      return result
    } catch (error: any) {
      console.error('Error sending bulk messages:', error)
      toast.error('Toplu mesaj gönderilirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'))
      throw error
    } finally {
      setSending(false)
    }
  }

  return {
    sending,
    sendMessage,
    sendBulkMessages
  }
}

export const useWhatsAppWeb = (userId: string | null) => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)

  const generateQR = async () => {
    if (!userId) return
    
    setConnecting(true)
    try {
      const response = await ApiService.callWhatsAppWebConnect({
        action: 'generate_qr',
        userId
      })
      
      if (response.success) {
        setQrCode(response.qrCode)
        toast.success('QR kod oluşturuldu')
      }
    } catch (error: any) {
      console.error('Error generating QR:', error)
      toast.error('QR kod oluşturulamadı')
    } finally {
      setConnecting(false)
    }
  }

  const connect = async () => {
    if (!userId) return
    
    try {
      const response = await ApiService.callWhatsAppWebConnect({
        action: 'connect',
        userId
      })
      
      if (response.success) {
        setConnected(true)
        setQrCode(null)
        toast.success('WhatsApp Web bağlantısı kuruldu')
      }
    } catch (error: any) {
      console.error('Error connecting:', error)
      toast.error('Bağlantı kurulamadı')
    }
  }

  const disconnect = async () => {
    if (!userId) return
    
    try {
      const response = await ApiService.callWhatsAppWebConnect({
        action: 'disconnect',
        userId
      })
      
      if (response.success) {
        setConnected(false)
        setQrCode(null)
        toast.success('WhatsApp Web bağlantısı kesildi')
      }
    } catch (error: any) {
      console.error('Error disconnecting:', error)
      toast.error('Bağlantı kesilemedi')
    }
  }

  const checkStatus = async () => {
    if (!userId) return
    
    try {
      const response = await ApiService.callWhatsAppWebConnect({
        action: 'status',
        userId
      })
      
      if (response.success) {
        setConnected(response.status === 'connected')
        setQrCode(response.qrCode)
      }
    } catch (error: any) {
      console.error('Error checking status:', error)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [userId])

  return {
    connected,
    connecting,
    qrCode,
    generateQR,
    connect,
    disconnect,
    checkStatus
  }
}

export const useWhatsAppBusinessAPI = (userId: string | null) => {
  const [settings, setSettings] = useState({
    apiKey: '',
    phoneNumberId: '',
    accessToken: '',
    isActive: false
  })
  const [loading, setLoading] = useState(false)

  const saveSettings = async (newSettings: typeof settings) => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await ApiService.callWhatsAppBusinessAPI({
        action: 'save_settings',
        userId,
        settings: newSettings
      })
      
      if (response.success) {
        setSettings(newSettings)
        toast.success('API ayarları kaydedildi')
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Ayarlar kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await ApiService.callWhatsAppBusinessAPI({
        action: 'test_connection',
        userId,
        settings
      })
      
      if (response.success) {
        toast.success('API bağlantısı başarılı')
      } else {
        toast.error(response.message || 'API bağlantısı başarısız')
      }
    } catch (error: any) {
      console.error('Error testing connection:', error)
      toast.error('Bağlantı testi başarısız')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (phoneNumber: string, message: string, mediaUrl?: string) => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await ApiService.callWhatsAppBusinessAPI({
        action: 'send_message',
        userId,
        settings: {
          phoneNumber,
          message,
          mediaUrl
        }
      })
      
      if (response.success) {
        toast.success('Mesaj gönderildi')
        return response
      } else {
        toast.error(response.message || 'Mesaj gönderilemedi')
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error('Mesaj gönderme hatası')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await ApiService.callWhatsAppBusinessAPI({
        action: 'get_settings',
        userId
      })
      
      if (response.success) {
        setSettings(response.settings)
      }
    } catch (error: any) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [userId])

  return {
    settings,
    loading,
    saveSettings,
    testConnection,
    sendMessage,
    loadSettings,
    setSettings
  }
}