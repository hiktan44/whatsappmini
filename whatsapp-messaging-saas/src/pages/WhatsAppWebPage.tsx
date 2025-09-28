import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Contact, MessageTemplate, MediaFile } from '@/lib/supabase'
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Send,
  Users,
  FileText,
  Image as ImageIcon,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MessageForm {
  selectedContacts: string[]
  templateId?: string
  customMessage?: string
  mediaFiles?: string[]
}

export function WhatsAppWebPage() {
  const { user } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean
    qrCode?: string
    lastConnected?: string
  }>({ isConnected: false })
  const [loading, setLoading] = useState(true)
  const [qrLoading, setQrLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)

  const { register, handleSubmit, watch, setValue, reset } = useForm<MessageForm>()
  const watchedTemplate = watch('templateId')

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
        setValue('customMessage', template.content)
      }
    } else {
      setSelectedTemplate(null)
    }
  }, [watchedTemplate, templates, setValue])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        checkConnectionStatus(),
        loadContacts(),
        loadTemplates(),
        loadMediaFiles()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-web-connect', {
        body: { action: 'check_connection' }
      })

      if (error) throw error

      if (data?.data) {
        setConnectionStatus({
          isConnected: data.data.is_connected,
          qrCode: data.data.qr_code,
          lastConnected: data.data.last_connected_at
        })
      }
    } catch (error: any) {
      console.error('Error checking connection status:', error)
    }
  }

  const generateQRCode = async () => {
    try {
      setQrLoading(true)
      const { data, error } = await supabase.functions.invoke('whatsapp-web-connect', {
        body: { action: 'generate_qr' }
      })

      if (error) throw error

      if (data?.data) {
        setConnectionStatus(prev => ({
          ...prev,
          qrCode: data.data.qr_code
        }))
        toast.success('QR kod oluşturuldu!')
      }
    } catch (error: any) {
      toast.error('QR kod oluşturulurken hata oluştu')
      console.error('Error generating QR code:', error)
    } finally {
      setQrLoading(false)
    }
  }

  const disconnect = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-web-connect', {
        body: { action: 'disconnect' }
      })

      if (error) throw error

      setConnectionStatus({
        isConnected: false,
        qrCode: undefined,
        lastConnected: undefined
      })
      toast.success('Bağlantı kesildi')
    } catch (error: any) {
      toast.error('Bağlantı kesilirken hata oluştu')
      console.error('Error disconnecting:', error)
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

  const loadMediaFiles = async () => {
    const { data } = await supabase
      .from('media_files')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    
    setMediaFiles(data || [])
  }

  const sendMessage = async (formData: MessageForm) => {
    if (!connectionStatus.isConnected) {
      toast.error('WhatsApp Web bağlantısı gerekli')
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

        // Simulate sending via WhatsApp Web (in real implementation, this would use WhatsApp Web API)
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ contactId, status: 'sent' })
          }, Math.random() * 1000 + 500)
        })
      })

      await Promise.all(sendPromises)
      
      toast.success(`${formData.selectedContacts.length} kişiye mesaj gönderildi`)
      setShowMessageModal(false)
      reset()
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
            WhatsApp Web
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            QR kod ile WhatsApp hesabınızı bağlayın ve mesaj gönderin
          </p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`h-4 w-4 rounded-full mr-3 ${
                connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <h3 className="text-lg font-medium text-gray-900">
                Bağlantı Durumu: {
                  connectionStatus.isConnected ? 'Bağlı' : 'Bağlı Değil'
                }
              </h3>
            </div>
            
            {connectionStatus.isConnected ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Send className="-ml-1 mr-2 h-4 w-4" />
                  Mesaj Gönder
                </button>
                <button
                  onClick={disconnect}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Bağlantıyı Kes
                </button>
              </div>
            ) : (
              <button
                onClick={generateQRCode}
                disabled={qrLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {qrLoading ? (
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                ) : (
                  <QrCode className="-ml-1 mr-2 h-4 w-4" />
                )}
                QR Kod Oluştur
              </button>
            )}
          </div>

          {/* QR Code Display */}
          {!connectionStatus.isConnected && connectionStatus.qrCode && (
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                {/* In a real implementation, you would generate and display an actual QR code */}
                <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <QrCode className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-500">
                      QR Kod Burada Görünecek
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Kod: {connectionStatus.qrCode}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                WhatsApp uygulamanızı açın, Menü {'>'} Bağlı Cihazlar {'>'} Cihaz Bağla seçeneğine gidin ve bu QR kodu tarayın.
              </p>
            </div>
          )}

          {/* Connection Info */}
          {connectionStatus.isConnected && connectionStatus.lastConnected && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Başarıyla Bağlandı
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Son bağlantı: {new Date(connectionStatus.lastConnected).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!connectionStatus.isConnected && !connectionStatus.qrCode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Bağlantı Gerekli
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Mesaj göndermek için WhatsApp hesabınızı bağlayın. QR kod oluştur butonuna tıklayın.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                <FileText className="h-6 w-6 text-green-600" />
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

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ImageIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Medya Dosyaları
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {mediaFiles.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <MessageModal
          contacts={contacts}
          templates={templates}
          mediaFiles={mediaFiles}
          selectedTemplate={selectedTemplate}
          onClose={() => {
            setShowMessageModal(false)
            reset()
          }}
          onSend={handleSubmit(sendMessage)}
          register={register}
          watch={watch}
          sending={sendingMessage}
        />
      )}
    </div>
  )
}

// Message Modal Component
function MessageModal({
  contacts,
  templates,
  mediaFiles,
  selectedTemplate,
  onClose,
  onSend,
  register,
  watch,
  sending
}: {
  contacts: Contact[]
  templates: MessageTemplate[]
  mediaFiles: MediaFile[]
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
          <h3 className="text-lg font-medium text-gray-900">Mesaj Gönder</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSend} className="space-y-6">
          {/* Contact Selection */}
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
                  <Send className="-ml-1 mr-2 h-4 w-4" />
                  Mesaj Gönder ({selectedContacts.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}