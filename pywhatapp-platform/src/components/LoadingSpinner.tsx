import React from 'react'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Yükleniyor...</h2>
        <p className="text-gray-600">PyWhatApp hazırlanıyor</p>
      </div>
    </div>
  )
}

export default LoadingSpinner