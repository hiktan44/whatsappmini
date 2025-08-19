import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useContacts } from '../hooks/useApi'
import { Contact, ApiService } from '../services/api'
import { toast } from 'react-hot-toast'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  PhoneIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

const ContactsPage: React.FC = () => {
  const { user } = useApi()
  const { contacts, loading, addContact, updateContact, deleteContact, fetchContacts } = useContacts(user?.id || null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    group_name: ''
  })

  // Filtered contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone_number.includes(searchTerm)
    const matchesGroup = selectedGroup === 'all' || contact.tags?.includes(selectedGroup)
    return matchesSearch && matchesGroup
  })

  // Get unique groups
  const groups = ['all', ...new Set(contacts.flatMap(c => c.tags || []).filter(Boolean))]

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', notes: '', group_name: '' })
    setEditingContact(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      const contactData = {
        ...formData,
        phone_number: formData.phone, // Map phone to phone_number
        user_id: user.id,
        tags: formData.group_name ? [formData.group_name] : undefined
      }
      delete (contactData as any).phone // Remove phone property

      if (editingContact) {
        await updateContact(editingContact.id, contactData)
      } else {
        await addContact(contactData)
      }
      resetForm()
    } catch (error) {
      console.error('Error saving contact:', error)
    }
  }

  const handleEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      phone: contact.phone_number, // Map phone_number to phone for form
      email: contact.email || '',
      notes: contact.notes || '',
      group_name: contact.tags?.[0] || ''
    })
    setEditingContact(contact)
    setShowAddForm(true)
  }

  const handleDelete = async (contact: Contact) => {
    if (window.confirm(`"${contact.name}" kişisini silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteContact(contact.id)
      } catch (error) {
        console.error('Error deleting contact:', error)
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    setImporting(true)
    try {
      const csvText = await file.text()
      const result = await ApiService.importContactsFromCSV(csvText, user.id, formData.group_name || undefined)
      
      if (result.data.success) {
        toast.success(`${result.data.successCount} kişi başarıyla içe aktarıldı!`)
        if (result.data.errors.length > 0) {
          toast.error(`${result.data.errors.length} hatada sorun var`)
          console.log('Import errors:', result.data.errors)
        }
        fetchContacts()
      }
    } catch (error: any) {
      toast.error('Dosya içe aktarılırken hata oluştu: ' + error.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Ad', 'Telefon', 'Notlar'],
      ['Ahmet Yılmaz', '05551234567', 'Müşteri'],
      ['Ayşe Kaya', '05559876543', 'Potansiyel müşteri'],
      ['Mehmet Demir', '05555555555', 'VIP müşteri']
    ]
    
    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'ornek-kisiler.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <Link 
                  to="/dashboard" 
                  className="flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Dashboard'a Dön
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Kişi Yönetimi</h1>
              <p className="mt-1 text-sm text-gray-600">WhatsApp kişilerinizi düzenleyin ve yönetin</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <DocumentArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
                {importing ? 'İçe Aktarılıyor...' : 'CSV İçe Aktar'}
              </button>
              <button
                onClick={downloadSampleCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Örnek CSV İndir
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Yeni Kişi
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        className="hidden"
      />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Kişi ara..."
              />
            </div>

            {/* Group Filter */}
            <div>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {groups.map(group => (
                  <option key={group} value={group}>
                    {group === 'all' ? 'Tüm Gruplar' : group}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-end space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-1" />
                {filteredContacts.length} kişi
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingContact ? 'Kişi Düzenle' : 'Yeni Kişi Ekle'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="05551234567 veya +905551234567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grup</label>
                  <input
                    type="text"
                    value={formData.group_name}
                    onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Müşteri, Potansiyel, VIP vb."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Bu kişi hakkında notlar..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Kaydediliyor...' : (editingContact ? 'Güncelle' : 'Kaydet')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contacts Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Kişiler yükleniyor...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-6 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Kişi bulunamadı</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedGroup !== 'all' 
                  ? 'Arama kriterlerinize uygun kişi bulunamadı.'
                  : 'Henüz hiç kişi eklenmemiş.'}
              </p>
              {!searchTerm && selectedGroup === 'all' && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  İlk kişinizi ekleyin
                </button>
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
                          <PhoneIcon className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </p>
                          {contact.tags && contact.tags.length > 0 && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {contact.tags[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-600">{contact.phone_number}</p>
                          {contact.email && (
                            <span className="ml-2 text-sm text-gray-500">• {contact.email}</span>
                          )}
                        </div>
                        {contact.notes && (
                          <p className="text-sm text-gray-500 mt-1 truncate">{contact.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(contact)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContactsPage