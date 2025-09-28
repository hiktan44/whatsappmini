import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Contact } from '@/lib/supabase'
import {
  Plus,
  Search,
  Upload,
  Download,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  User,
  Users,
  FileText,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ContactForm {
  name: string
  phone: string
  email?: string
  group_name?: string
  notes?: string
}

export function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [groups, setGroups] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadContacts()
    }
  }, [user])

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setContacts(data || [])
      
      // Extract unique groups
      const uniqueGroups = [...new Set(
        (data || []).map(contact => contact.group_name || 'Genel')
      )]
      setGroups(['all', ...uniqueGroups])
    } catch (error: any) {
      toast.error('Kişiler yüklenirken hata oluştu')
      console.error('Error loading contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter contacts based on search and group
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGroup = selectedGroup === 'all' || 
                        (contact.group_name || 'Genel') === selectedGroup
    
    return matchesSearch && matchesGroup
  })

  const deleteContact = async (id: string) => {
    if (!confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error

      setContacts(prev => prev.filter(c => c.id !== id))
      toast.success('Kişi başarıyla silindi')
    } catch (error: any) {
      toast.error('Kişi silinirken hata oluştu')
      console.error('Error deleting contact:', error)
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
            Kişiler
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {contacts.length} kişi • {filteredContacts.length} görüntülenen
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="-ml-1 mr-2 h-5 w-5" />
            İçe Aktar
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Yeni Kişi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Kişi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          {/* Group Filter */}
          <div className="sm:w-48">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Tüm Gruplar</option>
              {groups.filter(g => g !== 'all').map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || selectedGroup !== 'all' ? 'Kişi bulunamadı' : 'Henüz kişi eklenmemiş'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedGroup !== 'all' 
                ? 'Arama kriterlerinizi değiştirmeyi deneyin' 
                : 'İlk kişinizi ekleyerek başlayın'}
            </p>
            {!searchTerm && selectedGroup === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Yeni Kişi Ekle
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <li key={contact.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contact.name}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {contact.group_name || 'Genel'}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="flex-shrink-0 mr-1.5 h-4 w-4" />
                          {contact.phone}
                        </div>
                        {contact.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {contact.email}
                          </div>
                        )}
                      </div>
                      {contact.notes && (
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingContact(contact)}
                      className="p-2 text-gray-400 hover:text-green-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      {(showAddModal || editingContact) && (
        <ContactModal
          contact={editingContact}
          onClose={() => {
            setShowAddModal(false)
            setEditingContact(null)
          }}
          onSave={() => {
            loadContacts()
            setShowAddModal(false)
            setEditingContact(null)
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={() => {
            loadContacts()
            setShowImportModal(false)
          }}
        />
      )}
    </div>
  )
}

// Contact Modal Component
function ContactModal({ 
  contact, 
  onClose, 
  onSave 
}: { 
  contact: Contact | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm<ContactForm>({
    defaultValues: {
      name: contact?.name || '',
      phone: contact?.phone || '',
      email: contact?.email || '',
      group_name: contact?.group_name || 'Genel',
      notes: contact?.notes || ''
    }
  })

  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      if (contact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id)
          .eq('user_id', user?.id)

        if (error) throw error
        toast.success('Kişi başarıyla güncellendi')
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert({
            ...data,
            user_id: user?.id
          })

        if (error) throw error
        toast.success('Kişi başarıyla eklendi')
      }
      
      onSave()
    } catch (error: any) {
      toast.error(contact ? 'Kişi güncellenirken hata oluştu' : 'Kişi eklenirken hata oluştu')
      console.error('Error saving contact:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {contact ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">İsim</label>
            <input
              {...register('name', { required: 'İsim gereklidir' })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefon</label>
            <input
              {...register('phone', { required: 'Telefon numarası gereklidir' })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-posta (Opsiyonel)</label>
            <input
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Geçerli bir e-posta adresi girin'
                }
              })}
              type="email"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Grup</label>
            <input
              {...register('group_name')}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notlar (Opsiyonel)</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
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
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                contact ? 'Güncelle' : 'Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Import Modal Component
function ImportModal({ 
  onClose, 
  onImport 
}: { 
  onClose: () => void
  onImport: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [importType, setImportType] = useState<'excel' | 'whatsapp'>('excel')
  const [file, setFile] = useState<File | null>(null)

  const handleImport = async () => {
    if (!file) {
      toast.error('Lütfen bir dosya seçin')
      return
    }

    setLoading(true)
    try {
      const fileText = await file.text()
      let contactsData: any[] = []

      if (importType === 'whatsapp') {
        // Parse WhatsApp contacts JSON
        const jsonData = JSON.parse(fileText)
        contactsData = jsonData
      } else {
        // Parse Excel/CSV
        const lines = fileText.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim())
            const contact: any = {}
            headers.forEach((header, index) => {
              contact[header.toLowerCase()] = values[index] || ''
            })
            contactsData.push(contact)
          }
        }
      }

      // Import via edge function
      const { data, error } = await supabase.functions.invoke('import-contacts', {
        body: {
          contacts_data: contactsData,
          import_type: importType
        }
      })

      if (error) throw error

      if (data?.data?.success) {
        toast.success(
          `${data.data.imported_count} kişi başarıyla içe aktarıldı` +
          (data.data.error_count > 0 ? `, ${data.data.error_count} hata` : '')
        )
        onImport()
      }
    } catch (error: any) {
      toast.error('İçe aktarma sırasında hata oluştu')
      console.error('Import error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Kişi İçe Aktarma</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçe Aktarma Türü
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={importType === 'excel'}
                  onChange={(e) => setImportType(e.target.value as 'excel')}
                  className="mr-2"
                />
                Excel/CSV Dosyası
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="whatsapp"
                  checked={importType === 'whatsapp'}
                  onChange={(e) => setImportType(e.target.value as 'whatsapp')}
                  className="mr-2"
                />
                WhatsApp contacts.json
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosya Seç
            </label>
            <input
              type="file"
              accept={importType === 'whatsapp' ? '.json' : '.csv,.xlsx'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              {importType === 'whatsapp' 
                ? 'WhatsApp contacts.json dosyasını seçin'
                : 'CSV dosyasında sütunlar: name, phone, email, group şeklinde olmalıdır'}
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  İçe Aktarılıyor...
                </>
              ) : (
                'İçe Aktar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}