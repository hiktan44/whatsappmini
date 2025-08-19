import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useWhatsAppWeb, useContacts } from '../hooks/useApi'
import { ApiService } from '../services/api'
import { toast } from 'react-hot-toast'
import {
  QrCodeIcon,
  PhoneIcon,
  UserGroupIcon,
  LinkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline'

const WhatsAppPage: React.FC = () => {
  const { user } = useApi()
  const { connected, connecting, qrCode, generateQR, connect, disconnect, checkStatus } = useWhatsAppWeb(user?.id || null)
  const { addContact } = useContacts(user?.id || null)
  const [importingContacts, setImportingContacts] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  // Periyodik durum kontrolü
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus()
      setLastCheck(new Date())
    }, 10000) // Her 10 saniyede bir kontrol et

    return () => clearInterval(interval)
  }, [checkStatus])

  const handleGenerateQR = async () => {
    try {
      await generateQR()
    } catch (error) {
      console.error('QR generation failed:', error)
    }
  }

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Disconnection failed:', error)
    }
  }

  const handleImportContacts = async () => {
    if (!connected) {
      toast.error('Önce WhatsApp Web\'e bağlanmanız gerekiyor')
      return
    }

    setImportingContacts(true)
    try {
      // Gerçek API çağrısı yap
      const response = await ApiService.callWhatsAppWebConnect({
        action: 'import_contacts',
        userId: user!.id
      })

      if (response.success) {
        toast.success(`${response.importedCount} kişi başarıyla aktarıldı!`)
        if (response.skippedCount > 0) {
          toast.success(`${response.skippedCount} kişi zaten mevcuttu`, { duration: 2000 })
        }
        
        // Kişiler sayfasını güncellemek için yeniden yükle
        setTimeout(() => {
          window.location.href = '/contacts'
        }, 2000)
      } else {
        throw new Error(response.message || 'Kişi aktarımı başarısız')
      }
    } catch (error: any) {
      console.error('Contact import failed:', error)
      toast.error('Kişi aktarımında hata oluştu: ' + error.message)
    } finally {
      setImportingContacts(false)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp Bağlantısı</h1>
              <p className="mt-1 text-sm text-gray-600">WhatsApp Web'e bağlanın ve kişilerinizi aktarın</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${connected ? 'text-green-600' : 'text-red-600'}`}>
                {connected ? 'Bağlı' : 'Bağlantı Yok'}
              </span>
              {lastCheck && (
                <span className="text-xs text-gray-500">
                  Son kontrol: {lastCheck.toLocaleTimeString('tr-TR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Connection Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <LinkIcon className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp Web Bağlantısı</h2>
            </div>
            
            {!connected ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Bağlantı Gerekiyor</h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        WhatsApp Web'e bağlanmak için QR kodu taramanız gerekiyor.
                      </p>
                    </div>
                  </div>
                </div>

                {qrCode ? (
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto" />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      WhatsApp uygulamanızla bu QR kodu tarayın
                    </p>
                    <button
                      onClick={handleConnect}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Bağlantıyı Kontrol Et
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <button
                      onClick={handleGenerateQR}
                      disabled={connecting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {connecting ? (
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCodeIcon className="h-4 w-4 mr-2" />
                      )}
                      {connecting ? 'QR Oluşturuluyor...' : 'QR Kod Oluştur'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Başarıyla Bağlandı</h3>
                      <p className="mt-1 text-sm text-green-700">
                        WhatsApp Web bağlantınız aktif. Artık kişilerinizi aktarabilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={checkStatus}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Durumu Yenile
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Bağlantıyı Kes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contact Import Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Kişi Aktarımı</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <CloudArrowDownIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">WhatsApp Kişilerini Aktar</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      WhatsApp\'taki kişi listenizi platformunuza aktarın.
                    </p>
                  </div>
                </div>
              </div>

              {connected ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-md p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Aktarım Özellikleri:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Kişi adları ve telefon numaraları</li>
                      <li>• Otomatik grup etiketleme</li>
                      <li>• Duplikasyon kontrolü</li>
                      <li>• Güvenli veri transferi</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleImportContacts}
                    disabled={importingContacts}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {importingContacts ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Kişiler Aktarılıyor...
                      </>
                    ) : (
                      <>
                        <CloudArrowDownIcon className="h-4 w-4 mr-2" />
                        Kişileri Aktar
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <PhoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Kişi aktarımı için önce WhatsApp Web\'e bağlanmanız gerekiyor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nasıl Çalışır?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <QrCodeIcon className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">1. QR Kod Tarayın</h4>
              <p className="text-sm text-gray-600">
                WhatsApp uygulamanızla QR kodu tarayarak bağlantı kurun.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LinkIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">2. Bağlantıyı Doğrulayın</h4>
              <p className="text-sm text-gray-600">
                Bağlantının başarılı olduğunu kontrol edin.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">3. Kişileri Aktarın</h4>
              <p className="text-sm text-gray-600">
                WhatsApp kişilerinizi platformunuza güvenle aktarın.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppPage