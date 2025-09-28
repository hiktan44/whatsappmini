import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, MediaFile } from '@/lib/supabase'
import {
  Upload,
  Search,
  Image,
  Video,
  Music,
  FileText,
  Download,
  Trash2,
  X,
  Eye,
  Loader2,
  Plus,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

type FileType = 'all' | 'image' | 'video' | 'audio' | 'document'

const FILE_TYPE_ICONS = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText
}

const FILE_TYPE_COLORS = {
  image: 'text-green-600 bg-green-100',
  video: 'text-blue-600 bg-blue-100',
  audio: 'text-purple-600 bg-purple-100',
  document: 'text-red-600 bg-red-100'
}

export function MediaPage() {
  const { user } = useAuth()
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<FileType>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (user) {
      loadMediaFiles()
    }
  }, [user])

  const loadMediaFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMediaFiles(data || [])
    } catch (error: any) {
      toast.error('Medya dosyaları yüklenirken hata oluştu')
      console.error('Error loading media files:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFileType = (fileType: string): keyof typeof FILE_TYPE_ICONS => {
    if (fileType.startsWith('image/')) return 'image'
    if (fileType.startsWith('video/')) return 'video'
    if (fileType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Filter media files
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || getFileType(file.file_type) === selectedType
    return matchesSearch && matchesType
  })

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setUploading(true)
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        // Upload via edge function
        const { data, error } = await supabase.functions.invoke('media-upload', {
          body: {
            fileData: base64Data,
            fileName: file.name,
            fileType: file.type
          }
        })

        if (error) throw error
        return data?.data
      } catch (error) {
        console.error('Upload error for', file.name, ':', error)
        throw error
      }
    })

    try {
      const results = await Promise.allSettled(uploadPromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`${successful} dosya başarıyla yüklendi`)
        loadMediaFiles()
      }
      if (failed > 0) {
        toast.error(`${failed} dosya yüklenemedi`)
      }
    } catch (error) {
      toast.error('Dosya yükleme sırasında hata oluştu')
    } finally {
      setUploading(false)
      setShowUploadModal(false)
    }
  }

  const deleteFile = async (file: MediaFile) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) return

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', file.id)
        .eq('user_id', user?.id)

      if (dbError) throw dbError

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('whatsapp-media')
        .remove([file.storage_path])

      if (storageError) {
        console.warn('Storage deletion failed:', storageError)
      }

      setMediaFiles(prev => prev.filter(f => f.id !== file.id))
      toast.success('Dosya başarıyla silindi')
    } catch (error: any) {
      toast.error('Dosya silinirken hata oluştu')
      console.error('Error deleting file:', error)
    }
  }

  const downloadFile = (file: MediaFile) => {
    const link = document.createElement('a')
    link.href = file.public_url
    link.download = file.original_name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }, [])

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
            Medya Yönetimi
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {mediaFiles.length} dosya • {filteredFiles.length} görüntülenen
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Dosya Yükle
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
                placeholder="Dosya ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="sm:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as FileType)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Tüm Dosyalar</option>
              <option value="image">Resimler</option>
              <option value="video">Videolar</option>
              <option value="audio">Ses Dosyaları</option>
              <option value="document">Dokümanlar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || selectedType !== 'all' ? 'Dosya bulunamadı' : 'Henüz dosya yüklenmemiş'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedType !== 'all' 
              ? 'Arama kriterlerinizi değiştirmeyi deneyin' 
              : 'İlk dosyanızı yükleyerek başlayın'}
          </p>
          {!searchTerm && selectedType === 'all' && (
            <div className="mt-6">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Plus className="-ml-1 mr-2 h-5 w-5" />
                Dosya Yükle
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filteredFiles.map((file) => {
            const fileType = getFileType(file.file_type)
            const IconComponent = FILE_TYPE_ICONS[fileType]
            const colorClass = FILE_TYPE_COLORS[fileType]
            
            return (
              <div key={file.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-4">
                  {/* File Preview */}
                  <div className="aspect-square mb-3 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    {fileType === 'image' ? (
                      <img
                        src={file.public_url}
                        alt={file.original_name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => {
                          setPreviewFile(file)
                          setShowPreviewModal(true)
                        }}
                      />
                    ) : (
                      <div className={`p-3 rounded-md ${colorClass}`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 truncate" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(file.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t">
                    <button
                      onClick={() => {
                        setPreviewFile(file)
                        setShowPreviewModal(true)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Önizle"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="İndir"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteFile(file)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
          uploading={uploading}
          dragOver={dragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewFile(null)
          }}
        />
      )}
    </div>
  )
}

// Upload Modal Component
function UploadModal({ 
  onClose, 
  onUpload, 
  uploading,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop
}: { 
  onClose: () => void
  onUpload: (files: FileList) => void
  uploading: boolean
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) {
      onUpload(files)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Dosya Yükle</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <Upload className={`mx-auto h-12 w-12 ${
              dragOver ? 'text-green-500' : 'text-gray-400'
            }`} />
            <p className="mt-2 text-sm text-gray-600">
              Dosyaları buraya sürükleyin veya seçin
            </p>
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer"
            >
              Dosya Seç
            </label>
          </div>

          {/* Supported Formats */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600 font-medium mb-1">Desteklenen Formatlar:</p>
            <p className="text-xs text-gray-500">
              Resimler: JPG, PNG, GIF, WebP<br />
              Videolar: MP4, AVI, MOV<br />
              Ses: MP3, WAV, AAC<br />
              Dokümanlar: PDF, DOC, DOCX, XLS, XLSX
            </p>
          </div>

          {uploading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin h-6 w-6 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">Yükleniyor...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Preview Modal Component
function PreviewModal({ 
  file, 
  onClose 
}: { 
  file: MediaFile
  onClose: () => void
}) {
  const fileType = file.file_type.startsWith('image/') ? 'image' :
                  file.file_type.startsWith('video/') ? 'video' :
                  file.file_type.startsWith('audio/') ? 'audio' : 'document'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{file.original_name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Preview */}
          <div className="flex justify-center">
            {fileType === 'image' && (
              <img
                src={file.public_url}
                alt={file.original_name}
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            )}
            {fileType === 'video' && (
              <video
                src={file.public_url}
                controls
                className="max-w-full max-h-96 rounded-lg"
              >
                Tarayıcınız video etiketini desteklemiyor.
              </video>
            )}
            {fileType === 'audio' && (
              <audio
                src={file.public_url}
                controls
                className="w-full"
              >
                Tarayıcınız ses etiketini desteklemiyor.
              </audio>
            )}
            {fileType === 'document' && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500">Doküman önizlemesi desteklenmiyor</p>
                <a
                  href={file.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="-ml-1 mr-2 h-4 w-4" />
                  Dosyayı İndir
                </a>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Dosya Adı:</span>
                <p className="text-gray-900">{file.original_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Boyut:</span>
                <p className="text-gray-900">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tür:</span>
                <p className="text-gray-900">{file.file_type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Yükleme Tarihi:</span>
                <p className="text-gray-900">{new Date(file.created_at).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}