import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Contact, MessageTemplate } from '@/lib/supabase'
import {
  Phone,
  Settings,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  X,
  Users,
  MessageCircle,
  Save
} from 'lucide-react'
import toast from 'react-hot-toast'

interface APICredentialsForm {
  phone_number_id: string
  access_token: string
}

interface MessageForm {
  selectedContacts: string[]
  templateId?: string
  customMessage?: string
}

export function WhatsAppAPIPage() {
  const { user } = useAuth()
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean
    phoneNumberId?: string
    lastConnected?: string
  }>({ isConnected: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [showCredentialsForm, setShowCredentialsForm] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)

  const credentialsForm = useForm<APICredentialsForm>()
  const messageForm = useForm<MessageForm>()

  const watchedTemplate = messageForm.watch('templateId')

  useEffect(() => {
    if (user) {
      loadInitialData()
    }
  }, [user])

  useEffect(() => {
    if (watchedTemplate) {
      const template = templates.find(t => t.id === watchedTemplate)
      setSelectedTemplate(template || null)
      if (template) {
        messageForm.setValue('customMessage', template.content)
      }
    } else {
      setSelectedTemplate(null)
    }
  }, [watchedTemplate, templates])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        checkAPIStatus(),
        loadContacts(),
        loadTemplates()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAPIStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-business-api', {
        body: { action: 'get_status' }
      })

      if (error) throw error

      if (data?.data) {
        setApiStatus({
          isConnected: data.data.is_connected,
          phoneNumberId: data.data.phone_number_id,
          lastConnected: data.data.last_connected_at
        })
        
        if (data.data.is_connected) {
          credentialsForm.setValue('phone_number_id', data.data.phone_number_id || '')
        }
      }
    } catch (error: any) {
      console.error('Error checking API status:', error)
    }
  }

  const saveCredentials = async (formData: APICredentialsForm) => {
    try {
      setSaving(true)
      const { data, error } = await supabase.functions.invoke('whatsapp-business-api', {
        body: {
          action: 'save_credentials',
          phone_number_id: formData.phone_number_id,
          access_token: formData.access_token
        }
      })

      if (error) throw error

      setApiStatus({
        isConnected: true,
        phoneNumberId: formData.phone_number_id,
        lastConnected: new Date().toISOString()
      })
      
      setShowCredentialsForm(false)
      toast.success('API bilgileri başarıyla kaydedildi!')
    } catch (error: any) {
      toast.error('API bilgileri kaydedilirken hata oluştu')
      console.error('Error saving credentials:', error)
    } finally {
      setSaving(false)
    }
  }

  const loadContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user?.id)
      .order('name')
    
    setContacts(data || [])
  }

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user?.id)
      .order('name')
    
    setTemplates(data || [])
  }

  const sendMessage = async (formData: MessageForm) => {
    if (!apiStatus.isConnected) {
      toast.error('Business API bağlantısı gerekli')
      return
    }

    if (!formData.selectedContacts?.length) {
      toast.error('En az bir kişi seçin')
      return
    }

    if (!formData.customMessage?.trim()) {
      toast.error('Mesaj içeriği gerekli')
      return
    }

    try {
      setSendingMessage(true)
      
      // Send message to each selected contact
      const sendPromises = formData.selectedContacts.map(async (contactId) => {
        const contact = contacts.find(c => c.id === contactId)
        if (!contact) return

        // Replace variables in message
        let message = formData.customMessage || ''
        message = message
          .replace(/%ad%/g, contact.name.split(' ')[0] || contact.name)
          .replace(/%soyad%/g, contact.name.split(' ').slice(1).join(' ') || '')
          .replace(/%telefon%/g, contact.phone)
          .replace(/%email%/g, contact.email || '')
          .replace(/%tarih%/g, new Date().toLocaleDateString('tr-TR'))
          .replace(/%saat%/g, new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))

        // Send via Business API
        const { data, error } = await supabase.functions.invoke('whatsapp-business-api', {
          body: {
            action: 'send_message',
            recipient: contact,
            message: message,
            template_id: formData.templateId
          }
        })

        if (error) throw error
        return data
      })

      await Promise.all(sendPromises)
      
      toast.success(`${formData.selectedContacts.length} kişiye mesaj gönderildi`)
      setShowMessageModal(false)
      messageForm.reset()
    } catch (error: any) {
      toast.error('Mesaj gönderilirken hata oluştu')
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            WhatsApp Business API
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Resmi WhatsApp Business API ile gelişmiş mesajlaşma özellikleri
          </p>
        </div>
      </div>

      {/* API Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`h-4 w-4 rounded-full mr-3 ${
                apiStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <h3 className="text-lg font-medium text-gray-900">
                API Durumu: {
                  apiStatus.isConnected ? 'Bağlı' : 'Bağlı Değil'
                }
              </h3>
            </div>
            
            <div className="flex items-center space-x-3">
              {apiStatus.isConnected && (
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Send className="-ml-1 mr-2 h-4 w-4" />
                  Mesaj Gönder
                </button>
              )}
              <button
                onClick={() => setShowCredentialsForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="-ml-1 mr-2 h-4 w-4" />
                {apiStatus.isConnected ? 'Ayarları Güncelle' : 'API Ayarları'}
              </button>
            </div>
          </div>

          {/* API Connection Info */}
          {apiStatus.isConnected ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    API Başarıyla Bağlandı
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Phone Number ID: {apiStatus.phoneNumberId}</p>
                    {apiStatus.lastConnected && (
                      <p>Son bağlantı: {new Date(apiStatus.lastConnected).toLocaleString('tr-TR')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    API Yapılandırması Gerekli
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      WhatsApp Business API kullanmak için Phone Number ID ve Access Token bilgilerinizi girin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Setup Guide */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            WhatsApp Business API Kurulum Rehberi
          </h3>
          <div className="prose text-sm text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>Facebook Developers hesabınıza girin (developers.facebook.com)</li>
              <li>Yeni bir uygulama oluşturun ve WhatsApp Business API'sini ekleyin</li>
              <li>Phone Number ID'nizi alın (WhatsApp {'>'} Getting Started bölümünden)</li>
              <li>Access Token oluşturun (Tools {'>'} App Tokens bölümünden)</li>
              <li>Aşağıdaki formu kullanarak bilgilerinizi kaydedin</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-xs">
                <strong>Not:</strong> Bu bilgiler güvenli olarak saklanır ve yalnızca mesaj gönderimi için kullanılır.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Toplam Kişi
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {contacts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Mesaj Şablonları
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {templates.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentialsForm && (
        <CredentialsModal
          onClose={() => setShowCredentialsForm(false)}
          onSave={credentialsForm.handleSubmit(saveCredentials)}
          register={credentialsForm.register}
          errors={credentialsForm.formState.errors}
          saving={saving}
          showToken={showToken}
          setShowToken={setShowToken}
        />
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <MessageModal
          contacts={contacts}
          templates={templates}
          selectedTemplate={selectedTemplate}
          onClose={() => {
            setShowMessageModal(false)
            messageForm.reset()
          }}
          onSend={messageForm.handleSubmit(sendMessage)}
          register={messageForm.register}
          watch={messageForm.watch}
          sending={sendingMessage}
        />
      )}
    </div>
  )
}

// Credentials Modal Component
function CredentialsModal({
  onClose,
  onSave,
  register,
  errors,
  saving,
  showToken,
  setShowToken
}: {
  onClose: () => void
  onSave: () => void
  register: any
  errors: any
  saving: boolean
  showToken: boolean
  setShowToken: (show: boolean) => void
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">API Bilgileri</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
            <input
              {...register('phone_number_id', { required: 'Phone Number ID gereklidir' })}
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="123456789012345"
            />
            {errors.phone_number_id && (
              <p className="mt-1 text-sm text-red-600">{errors.phone_number_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Access Token</label>
            <div className="mt-1 relative">
              <input
                {...register('access_token', { required: 'Access Token gereklidir' })}
                type={showToken ? 'text' : 'password'}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="EAAxxxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.access_token && (
              <p className="mt-1 text-sm text-red-600">{errors.access_token.message}</p>
            )}
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-600">
              Bu bilgiler şifrelenerek güvenli bir şekilde saklanır ve yalnızca WhatsApp mesajı göndermek için kullanılır.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Message Modal Component (Similar to WhatsApp Web but for API)
function MessageModal({
  contacts,
  templates,
  selectedTemplate,
  onClose,
  onSend,
  register,
  watch,
  sending
}: {
  contacts: Contact[]
  templates: MessageTemplate[]
  selectedTemplate: MessageTemplate | null
  onClose: () => void
  onSend: () => void
  register: any
  watch: any
  sending: boolean
}) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showContactList, setShowContactList] = useState(false)
  
  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const selectAllContacts = () => {
    setSelectedContacts(contacts.map(c => c.id))
  }

  const clearSelection = () => {
    setSelectedContacts([])
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Business API ile Mesaj Gönder</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSend} className="space-y-6">
          {/* Contact Selection - Same as WhatsApp Web */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alıcılar ({selectedContacts.length} kişi seçildi)
            </label>
            <div className="border border-gray-300 rounded-md">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowContactList(!showContactList)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showContactList ? 'Listeyi Gizle' : 'Kişi Listesini Göster'}
                  </button>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={selectAllContacts}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
              </div>
              
              {showContactList && (
                <div className="max-h-48 overflow-y-auto p-3">
                  <div className="space-y-2">
                    {contacts.map(contact => (
                      <label key={contact.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {selectedContacts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedContacts.slice(0, 5).map(contactId => {
                  const contact = contacts.find(c => c.id === contactId)
                  return contact ? (
                    <span key={contactId} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      {contact.name}
                    </span>
                  ) : null
                })}
                {selectedContacts.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    +{selectedContacts.length - 5} diğeri
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şablon Seç (Opsiyonel)
            </label>
            <select
              {...register('templateId')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Özel mesaj yaz</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
            </select>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mesaj İçeriği
            </label>
            <textarea
              {...register('customMessage', { required: 'Mesaj içeriği gereklidir' })}
              rows={6}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Mesajınızı buraya yazın..."
            />
            
            {selectedTemplate && selectedTemplate.variables?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Kullanılabilir değişkenler:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.variables.map((variable, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={sending || selectedContacts.length === 0}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Phone className="-ml-1 mr-2 h-4 w-4" />
                  API ile Gönder ({selectedContacts.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}