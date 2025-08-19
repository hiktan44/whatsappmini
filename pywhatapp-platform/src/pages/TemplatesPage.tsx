import React, { useState } from 'react'
import { useApi, useTemplates, useVariables } from '../hooks/useApi'
import { MessageTemplate } from '../services/api'
import { toast } from 'react-hot-toast'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentTextIcon,
  EyeIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const TemplatesPage: React.FC = () => {
  const { user } = useApi()
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useTemplates(user?.id || null)
  const { variables } = useVariables(user?.id || null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    template_name: '',
    content: '',
    category: 'general',
    variables: [] as string[]
  })

  // Predefined categories
  const categories = [
    { value: 'general', label: 'Genel', color: 'gray' },
    { value: 'marketing', label: 'Pazarlama', color: 'blue' },
    { value: 'appointment', label: 'Randevu', color: 'green' },
    { value: 'thanks', label: 'Teşekkür', color: 'purple' },
    { value: 'celebration', label: 'Kutlama', color: 'yellow' },
    { value: 'reminder', label: 'Hatırlatma', color: 'red' },
    { value: 'follow-up', label: 'Takip', color: 'indigo' }
  ]

  // System variables
  const systemVariables = [
    { name: '%ad%', description: 'Kişinin adı' },
    { name: '%isim%', description: 'Kişinin ismi' },
    { name: '%tarih%', description: 'Bugünün tarihi' },
    { name: '%saat%', description: 'Şu anki saat' },
    { name: '%gun%', description: 'Günün sayısı' },
    { name: '%ay%', description: 'Ay sayısı' },
    { name: '%yil%', description: 'Yıl' },
    { name: '%sayin%', description: 'Sayın (nezaket ifadesi)' },
    { name: '%degerli%', description: 'Değerli (nezaket ifadesi)' },
    { name: '%kiymetli%', description: 'Kıymetli (nezaket ifadesi)' },
    { name: '%sevgili%', description: 'Sevgili (nezaket ifadesi)' }
  ]

  // Filtered templates
  const filteredTemplates = templates.filter(template => {
    return selectedCategory === 'all' || template.category === selectedCategory
  })

  // Get unique categories from templates
  const usedCategories = [...new Set(templates.map(t => t.category))]

  const resetForm = () => {
    setFormData({ template_name: '', content: '', category: 'general', variables: [] })
    setEditingTemplate(null)
    setShowAddForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    // Extract variables from content
    const contentVariables = extractVariables(formData.content)

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          ...formData,
          user_id: user.id,
          variables: contentVariables
        })
      } else {
        await addTemplate({
          ...formData,
          user_id: user.id,
          variables: contentVariables
        })
      }
      resetForm()
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const extractVariables = (content: string): string[] => {
    const regex = /%([^%]+)%/g
    const matches = []
    let match
    while ((match = regex.exec(content)) !== null) {
      matches.push(`%${match[1]}%`)
    }
    return [...new Set(matches)]
  }

  const handleEdit = (template: MessageTemplate) => {
    setFormData({
      template_name: template.template_name,
      content: template.content,
      category: template.category,
      variables: template.variables || []
    })
    setEditingTemplate(template)
    setShowAddForm(true)
  }

  const handleDelete = async (template: MessageTemplate) => {
    if (window.confirm(`"${template.template_name}" şablonunu silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteTemplate(template.id)
      } catch (error) {
        console.error('Error deleting template:', error)
      }
    }
  }

  const handlePreview = (template: MessageTemplate) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentContent = formData.content
      const newContent = currentContent.substring(0, start) + variable + currentContent.substring(end)
      setFormData({ ...formData, content: newContent })
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(c => c.value === category)
    return categoryData?.color || 'gray'
  }

  const processPreviewContent = (content: string) => {
    let processed = content
    
    // Replace with example values
    processed = processed.replace(/%ad%/g, 'Ahmet Yılmaz')
    processed = processed.replace(/%isim%/g, 'Ahmet')
    processed = processed.replace(/%tarih%/g, new Date().toLocaleDateString('tr-TR'))
    processed = processed.replace(/%saat%/g, new Date().toLocaleTimeString('tr-TR'))
    processed = processed.replace(/%gun%/g, new Date().getDate().toString())
    processed = processed.replace(/%ay%/g, (new Date().getMonth() + 1).toString())
    processed = processed.replace(/%yil%/g, new Date().getFullYear().toString())
    processed = processed.replace(/%sayin%/g, 'Sayın')
    processed = processed.replace(/%degerli%/g, 'Değerli')
    processed = processed.replace(/%kiymetli%/g, 'Kıymetli')
    processed = processed.replace(/%sevgili%/g, 'Sevgili')
    
    // Replace custom variables
    variables.forEach(variable => {
      const regex = new RegExp(`%${variable.variable_name}%`, 'g')
      processed = processed.replace(regex, variable.variable_value)
    })
    
    return processed
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Şablon Yönetimi</h1>
              <p className="mt-1 text-sm text-gray-600">Mesaj şablonlarınızı oluşturun ve düzenleyin</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Yeni Şablon
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCategory === 'all'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tüm Kategoriler ({templates.length})
            </button>
            {usedCategories.map(category => {
              const categoryData = categories.find(c => c.value === category)
              const count = templates.filter(t => t.category === category).length
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryData?.label || category} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon Oluştur'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şablon Adı *</label>
                    <input
                      type="text"
                      value={formData.template_name}
                      onChange={(e) => setFormData({...formData, template_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj İçeriği *</label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Mesaj içeriğinizi yazın... Değişkenler için %değişken_adı% formatını kullanın."
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Mevcut değişkenler: {extractVariables(formData.content).join(', ')}
                  </p>
                </div>

                {/* Variables Helper */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hızlı Değişken Ekleme</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {systemVariables.map(variable => (
                      <button
                        key={variable.name}
                        type="button"
                        onClick={() => insertVariable(variable.name)}
                        className="text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
                        title={variable.description}
                      >
                        <span className="font-medium text-green-600">{variable.name}</span>
                        <br />
                        <span className="text-gray-500">{variable.description}</span>
                      </button>
                    ))}
                  </div>
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
                    {loading ? 'Kaydediliyor...' : (editingTemplate ? 'Güncelle' : 'Kaydet')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && previewTemplate && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Şablon Önizleme</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{previewTemplate.template_name}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(previewTemplate.category)}-100 text-${getCategoryColor(previewTemplate.category)}-800 mt-1`}>
                    {categories.find(c => c.value === previewTemplate.category)?.label || previewTemplate.category}
                  </span>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Orijinal:</h5>
                  <div className="p-3 bg-gray-50 rounded-md border text-sm">
                    {previewTemplate.content}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Örnek Çıktı:</h5>
                  <div className="p-3 bg-green-50 rounded-md border text-sm">
                    {processPreviewContent(previewTemplate.content)}
                  </div>
                </div>

                {previewTemplate.variables && previewTemplate.variables.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Kullanılan Değişkenler:</h5>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.variables.map(variable => (
                        <span key={variable} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Şablonlar yükleniyor...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="col-span-full p-6 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Şablon bulunamadı</h3>
              <p className="text-gray-600 mb-4">
                {selectedCategory !== 'all' 
                  ? 'Bu kategoride şablon bulunamadı.'
                  : 'Henüz hiç şablon eklenmemiş.'}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                {selectedCategory !== 'all' ? 'Yeni Şablon Ekle' : 'İlk şablonunuzu oluşturun'}
              </button>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{template.template_name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-800`}>
                      {categories.find(c => c.value === template.category)?.label || template.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {template.content.length > 150 ? template.content.substring(0, 150) + '...' : template.content}
                  </p>
                  
                  {template.variables && template.variables.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <SparklesIcon className="h-3 w-3 mr-1" />
                        Değişkenler:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map(variable => (
                          <span key={variable} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {variable}
                          </span>
                        ))}
                        {template.variables.length > 3 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{template.variables.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      {new Date(template.created_at).toLocaleDateString('tr-TR')}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handlePreview(template)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Önizle"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Düzenle"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Sil"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplatesPage