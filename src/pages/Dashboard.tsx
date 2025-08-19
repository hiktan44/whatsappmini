import React, { useState } from 'react'
import { useApi, useContacts, useTemplates, useVariables, useMediaFiles, useWhatsApp } from '../hooks/useApi'
import { PaperPlaneIcon, PhoneIcon, DocumentTextIcon, PhotoIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { Toaster } from 'react-hot-toast'

const Dashboard: React.FC = () => {
  const { user } = useApi()
  const { contacts } = useContacts(user?.id || null)
  const { templates } = useTemplates(user?.id || null)
  const { variables } = useVariables(user?.id || null)
  const { mediaFiles } = useMediaFiles(user?.id || null)
  const { sendMessage, sending } = useWhatsApp()

  const [activeTab, setActiveTab] = useState('send')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [messageText, setMessageText] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedMedia, setSelectedMedia] = useState<string>('')

  // Process message with variables
  const processMessage = (text: string) => {
    let processedText = text
    
    // Replace system variables
    const now = new Date()
    processedText = processedText.replace(/%tarih%/g, now.toLocaleDateString('tr-TR'))
    processedText = processedText.replace(/%saat%/g, now.toLocaleTimeString('tr-TR'))
    
    // Replace custom variables
    variables.forEach(variable => {
      const regex = new RegExp(`%${variable.variable_name}%`, 'g')
      processedText = processedText.replace(regex, variable.variable_value)
    })
    
    return processedText
  }

  const handleSendMessage = async () => {
    if (selectedContacts.length === 0) {
      alert('Lütfen en az bir kişi seçin')
      return
    }
    
    if (!messageText.trim()) {
      alert('Lütfen mesaj metni girin')
      return
    }

    try {
      const processedMessage = processMessage(messageText)
      const phoneNumbers = selectedContacts.map(contactId => {
        const contact = contacts.find(c => c.id === contactId)
        return contact?.phone_number || ''
      }).filter(phone => phone)

      await sendMessage({
        contacts: phoneNumbers,
        message: processedMessage,
        mediaUrl: selectedMedia,
        variables: variables.reduce((acc, v) => ({ ...acc, [v.variable_name]: v.variable_value }), {})
      })

      // Reset form
      setSelectedContacts([])
      setMessageText('')
      setSelectedTemplate('')
      setSelectedMedia('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setMessageText(template.content)
      setSelectedTemplate(templateId)
    }
  }

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const selectAllContacts = () => {
    setSelectedContacts(contacts.map(c => c.id))
  }

  const clearAllContacts = () => {
    setSelectedContacts([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img className="h-8 w-8" src="/logo.svg" alt="PyWhatApp" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">PyWhatApp Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-4">Hoşgeldin, {user?.email}</span>
              <button className="p-2 rounded-md text-gray-400 hover:text-gray-500">
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PhoneIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Toplam Kişi</dt>
                      <dd className="text-lg font-medium text-gray-900">{contacts.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Şablonlar</dt>
                      <dd className="text-lg font-medium text-gray-900">{templates.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PhotoIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Medya Dosyaları</dt>
                      <dd className="text-lg font-medium text-gray-900">{mediaFiles.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <PaperPlaneIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Değişkenler</dt>
                      <dd className="text-lg font-medium text-gray-900">{variables.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('send')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'send'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Mesaj Gönder
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'contacts'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Kişiler
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'templates'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Şablonlar
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'media'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Medya
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Send Message Tab */}
              {activeTab === 'send' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">WhatsApp Mesajı Gönder</h3>
                    
                    {/* Template Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Seç</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Şablon seçin...</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.template_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message Text */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj Metni</label>
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={4}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Mesajınızı yazın... Değişkenler için %değişken_adı% formatını kullanın."
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Kullanılabilir değişkenler: %tarih%, %saat%
                        {variables.length > 0 && ', ' + variables.map(v => `%${v.variable_name}%`).join(', ')}
                      </p>
                    </div>

                    {/* Media Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Medya Dosyası (Opsiyonel)</label>
                      <select
                        value={selectedMedia}
                        onChange={(e) => setSelectedMedia(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Medya seçin...</option>
                        {mediaFiles.map((media) => (
                          <option key={media.id} value={media.file_url}>
                            {media.file_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Contact Selection */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Alıcılar ({selectedContacts.length} seçili)</label>
                        <div className="flex space-x-2">
                          <button
                            onClick={selectAllContacts}
                            className="text-sm text-green-600 hover:text-green-500"
                          >
                            Tümünü Seç
                          </button>
                          <button
                            onClick={clearAllContacts}
                            className="text-sm text-gray-600 hover:text-gray-500"
                          >
                            Temizle
                          </button>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                        {contacts.length === 0 ? (
                          <p className="text-gray-500 text-sm">Henüz kişi eklenmemiş</p>
                        ) : (
                          <div className="space-y-2">
                            {contacts.map((contact) => (
                              <label key={contact.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedContacts.includes(contact.id)}
                                  onChange={() => handleContactToggle(contact.id)}
                                  className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm text-gray-900">
                                  {contact.name} ({contact.phone_number})
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || selectedContacts.length === 0 || !messageText.trim()}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <PaperPlaneIcon className="h-5 w-5 mr-2" />
                          Mesaj Gönder
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Other tabs content will be added later */}
              {activeTab === 'contacts' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Kişi Yönetimi</h3>
                  <p className="text-gray-600">Kişi yönetimi sayfası yakında...</p>
                </div>
              )}

              {activeTab === 'templates' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Şablon Yönetimi</h3>
                  <p className="text-gray-600">Şablon yönetimi sayfası yakında...</p>
                </div>
              )}

              {activeTab === 'media' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medya Yönetimi</h3>
                  <p className="text-gray-600">Medya yönetimi sayfası yakında...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard