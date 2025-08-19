import React, { useState, useRef } from 'react'
import { useApi, useMediaFiles } from '../hooks/useApi'
import { MediaFile } from '../services/api'
import { toast } from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  TrashIcon,
  EyeIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  FolderIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

const MediaPage: React.FC = () => {
  const { user } = useApi()
  const { mediaFiles, loading, uploading, uploadFile, deleteFile, fetchMediaFiles } = useMediaFiles(user?.id || null)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Supported file types
  const supportedTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac'],
    document: ['pdf', 'doc', 'docx', 'txt', 'rtf']
  }

  // Filter media files
  const filteredMediaFiles = mediaFiles.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || file.file_type === selectedType
    return matchesSearch && matchesType
  })

  // Get file type from filename
  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    if (supportedTypes.image.includes(extension)) return 'image'
    if (supportedTypes.video.includes(extension)) return 'video'
    if (supportedTypes.audio.includes(extension)) return 'audio'
    if (supportedTypes.document.includes(extension)) return 'document'
    
    return 'other'
  }

  // Get file icon
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return PhotoIcon
      case 'video': return FilmIcon
      case 'audio': return MusicalNoteIcon
      case 'document': return DocumentIcon
      default: return FolderIcon
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (!user?.id) return

    for (const file of files) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} dosyası çok büyük (maksimum 50MB)`)
        continue
      }

      // Check file type
      const fileType = getFileType(file.name)
      if (fileType === 'other') {
        toast.error(`${file.name} desteklenmeyen dosya formatı`)
        continue
      }

      try {
        await uploadFile(file)
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
      }
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFileUpload(files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle delete
  const handleDelete = async (file: MediaFile) => {
    if (window.confirm(`"${file.file_name}" dosyasını silmek istediğinizden emin misiniz?`)) {
      try {
        // Extract filename from URL for storage deletion
        const urlParts = file.file_url.split('/')
        const storageFileName = urlParts.slice(-2).join('/') // user_id/filename
        await deleteFile(file.id, storageFileName)
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }
  }

  // Handle preview
  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  // Get file type counts
  const getTypeStats = () => {
    const stats = {
      all: mediaFiles.length,
      image: mediaFiles.filter(f => f.file_type === 'image').length,
      video: mediaFiles.filter(f => f.file_type === 'video').length,
      audio: mediaFiles.filter(f => f.file_type === 'audio').length,
      document: mediaFiles.filter(f => f.file_type === 'document').length,
      other: mediaFiles.filter(f => !['image', 'video', 'audio', 'document'].includes(f.file_type)).length
    }
    return stats
  }

  const typeStats = getTypeStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medya Yönetimi</h1>
              <p className="mt-1 text-sm text-gray-600">Resim, video, ses ve belge dosyalarınızı yönetin</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
              {uploading ? 'Yükleniyor...' : 'Dosya Yükle'}
            </button>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.rtf"
        multiple
        className="hidden"
      />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Upload Area */}
        <div
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${dragOver ? 'text-green-500' : 'text-gray-400'}`} />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            {dragOver ? 'Dosyaları bırakın' : 'Dosya yükle'}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Dosyaları buraya sürükleyip bırakın veya{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-green-600 hover:text-green-500 font-medium"
            >
              göz atın
            </button>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF, MP4, PDF, DOC dosyaları (Maksimum 50MB)
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                placeholder="Dosya ara..."
              />
            </div>

            {/* Type filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Tümü', icon: FolderIcon },
                { key: 'image', label: 'Resim', icon: PhotoIcon },
                { key: 'video', label: 'Video', icon: FilmIcon },
                { key: 'audio', label: 'Ses', icon: MusicalNoteIcon },
                { key: 'document', label: 'Belge', icon: DocumentIcon }
              ].map(type => {
                const count = typeStats[type.key as keyof typeof typeStats]
                const IconComponent = type.icon
                return (
                  <button
                    key={type.key}
                    onClick={() => setSelectedType(type.key)}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedType === type.key
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-1" />
                    {type.label} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && previewFile && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Dosya Önizleme</h3>
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
                <div className="text-center">
                  {previewFile.file_type === 'image' && (
                    <img
                      src={previewFile.file_url}
                      alt={previewFile.file_name}
                      className="max-w-full h-auto rounded-lg shadow"
                    />
                  )}
                  {previewFile.file_type === 'video' && (
                    <video
                      src={previewFile.file_url}
                      controls
                      className="max-w-full h-auto rounded-lg shadow"
                    >
                      Tarayıcınız video oynatmayı desteklemiyor.
                    </video>
                  )}
                  {previewFile.file_type === 'audio' && (
                    <audio
                      src={previewFile.file_url}
                      controls
                      className="w-full"
                    >
                      Tarayıcınız ses oynatmayı desteklemiyor.
                    </audio>
                  )}
                  {previewFile.file_type === 'document' && (
                    <div className="p-8">
                      <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Belge önizlemesi mevcut değil</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500">Dosya Adı</dt>
                      <dd className="text-gray-900">{previewFile.file_name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Boyut</dt>
                      <dd className="text-gray-900">{formatFileSize(previewFile.file_size)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Tür</dt>
                      <dd className="text-gray-900">{previewFile.file_type}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Yüklenme Tarihi</dt>
                      <dd className="text-gray-900">{new Date(previewFile.created_at).toLocaleDateString('tr-TR')}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex justify-center space-x-3 pt-4">
                  <a
                    href={previewFile.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Yeni Sekmede Aç
                  </a>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Grid */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Medya dosyaları yükleniyor...</p>
            </div>
          ) : filteredMediaFiles.length === 0 ? (
            <div className="p-6 text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Medya dosyası bulunamadı</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedType !== 'all' 
                  ? 'Arama kriterlerinize uygun dosya bulunamadı.'
                  : 'Henüz hiç medya dosyası yüklenmemiş.'}
              </p>
              {!searchTerm && selectedType === 'all' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
                  İlk dosyanızı yükleyin
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 p-6">
              {filteredMediaFiles.map((file) => {
                const IconComponent = getFileIcon(file.file_type)
                return (
                  <div key={file.id} className="group relative bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="aspect-square p-4 flex items-center justify-center bg-gray-50 rounded-t-lg">
                      {file.file_type === 'image' ? (
                        <img
                          src={file.file_url}
                          alt={file.file_name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <IconComponent className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate" title={file.file_name}>
                        {file.file_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(file.file_size)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handlePreview(file)}
                          className="p-1 bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-600"
                          title="Önizle"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(file)}
                          className="p-1 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-600"
                          title="Sil"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* File type badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        file.file_type === 'image' ? 'bg-green-100 text-green-800' :
                        file.file_type === 'video' ? 'bg-blue-100 text-blue-800' :
                        file.file_type === 'audio' ? 'bg-purple-100 text-purple-800' :
                        file.file_type === 'document' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {file.file_type}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaPage