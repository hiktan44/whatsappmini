import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, MessageTemplate } from '@/lib/supabase'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  FileText,
  Eye,
  Copy,
  Loader2,
  Tag
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TemplateForm {
  name: string
  content: string
  category: string
}

const CATEGORIES = [
  'İş',
  'Sağlık',
  'Eğitim',
  'Pazarlama',
  'Kişisel',
  'Özel'
]

const VARIABLES = [
  { name: '%ad%', description: 'Kişinin adı' },
  { name: '%soyad%', description: 'Kişinin soyadı' },
  { name: '%tarih%', description: 'Bugünün tarihi' },
  { name: '%saat%', description: 'Şu anki saat' },
  { name: '%company%', description: 'Şirket adı' },
  { name: '%telefon%', description: 'Kişinin telefon numarası' },
  { name: '%email%', description: 'Kişinin e-posta adresi' }
]

export function TemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null)

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error: any) {
      toast.error('Şablonlar yüklenirken hata oluştu')
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const deleteTemplate = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (error) throw error

      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Şablon başarıyla silindi')
    } catch (error: any) {
      toast.error('Şablon silinirken hata oluştu')
      console.error('Error deleting template:', error)
    }
  }

  const copyTemplate = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content)
    toast.success('Şablon panoya kopyalandı')
  }

  const previewTemplateWithVariables = (content: string) => {
    return content
      .replace(/%ad%/g, 'Ahmet')
      .replace(/%soyad%/g, 'Yılmaz')
      .replace(/%tarih%/g, new Date().toLocaleDateString('tr-TR'))
      .replace(/%saat%/g, new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))
      .replace(/%company%/g, 'ABC Şirketi')
      .replace(/%telefon%/g, '+90 555 123 4567')
      .replace(/%email%/g, 'ahmet@example.com')
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
            Mesaj Şablonları
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {templates.length} şablon • {filteredTemplates.length} görüntülenen
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Yeni Şablon
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
                placeholder="Şablon ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Tüm Kategoriler</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || selectedCategory !== 'all' ? 'Şablon bulunamadı' : 'Henüz şablon eklenmemiş'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Arama kriterlerinizi değiştirmeyi deneyin' 
              : 'İlk şablonunuzu ekleyerek başlayın'}
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Yeni Şablon Ekle
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Varsayılan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setPreviewTemplate(template)
                        setShowPreviewModal(true)
                      }}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Önizle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => copyTemplate(template)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Kopyala"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {!template.is_default && (
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <Tag className="h-3 w-3 mr-1" />
                    {template.category}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-3">
                  {template.content}
                </p>
                
                {template.variables && template.variables.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Değişkenler:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Template Modal */}
      {(showAddModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowAddModal(false)
            setEditingTemplate(null)
          }}
          onSave={() => {
            loadTemplates()
            setShowAddModal(false)
            setEditingTemplate(null)
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewTemplate(null)
          }}
          previewWithVariables={previewTemplateWithVariables}
        />
      )}
    </div>
  )
}

// Template Modal Component
function TemplateModal({ 
  template, 
  onClose, 
  onSave 
}: { 
  template: MessageTemplate | null
  onClose: () => void
  onSave: () => void
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<TemplateForm>({
    defaultValues: {
      name: template?.name || '',
      content: template?.content || '',
      category: template?.category || 'Özel'
    }
  })

  const content = watch('content')

  const insertVariable = (variable: string) => {
    const currentContent = content || ''
    setValue('content', currentContent + ' ' + variable)
  }

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/%\w+%/g)
    return matches ? [...new Set(matches)] : []
  }

  const onSubmit = async (data: TemplateForm) => {
    setLoading(true)
    try {
      const variables = extractVariables(data.content)
      
      if (template) {
        // Update existing template
        const { error } = await supabase
          .from('message_templates')
          .update({
            ...data,
            variables,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id)
          .eq('user_id', user?.id)

        if (error) throw error
        toast.success('Şablon başarıyla güncellendi')
      } else {
        // Create new template
        const { error } = await supabase
          .from('message_templates')
          .insert({
            ...data,
            user_id: user?.id,
            variables,
            is_default: false
          })

        if (error) throw error
        toast.success('Şablon başarıyla eklendi')
      }
      
      onSave()
    } catch (error: any) {
      toast.error(template ? 'Şablon güncellenirken hata oluştu' : 'Şablon eklenirken hata oluştu')
      console.error('Error saving template:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {template ? 'Şablonu Düzenle' : 'Yeni Şablon Ekle'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Şablon Adı</label>
              <input
                {...register('name', { required: 'Şablon adı gereklidir' })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <select
                {...register('category', { required: 'Kategori gereklidir' })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj İçeriği</label>
            <textarea
              {...register('content', { required: 'Mesaj içeriği gereklidir' })}
              rows={6}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Mesajınızı buraya yazın..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          </div>

          {/* Variables */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kullanılabilir Değişkenler</label>
            <div className="grid grid-cols-2 gap-2">
              {VARIABLES.map((variable) => (
                <button
                  key={variable.name}
                  type="button"
                  onClick={() => insertVariable(variable.name)}
                  className="text-left p-2 border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <div className="text-sm font-medium text-green-600">{variable.name}</div>
                  <div className="text-xs text-gray-500">{variable.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detected Variables */}
          {content && extractVariables(content).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tespit Edilen Değişkenler</label>
              <div className="flex flex-wrap gap-1">
                {extractVariables(content).map((variable, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}

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
                template ? 'Güncelle' : 'Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Preview Modal Component
function PreviewModal({ 
  template, 
  onClose, 
  previewWithVariables 
}: { 
  template: MessageTemplate
  onClose: () => void
  previewWithVariables: (content: string) => string
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Şablon Önizlemesi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Orijinal Metin</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{template.content}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Örnek Görünüm (Değişkenler doldurulmuş)</h4>
            <div className="bg-green-50 p-3 rounded-md border border-green-200">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {previewWithVariables(template.content)}
              </p>
            </div>
          </div>

          {template.variables && template.variables.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Kullanılan Değişkenler</h4>
              <div className="flex flex-wrap gap-1">
                {template.variables.map((variable, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}