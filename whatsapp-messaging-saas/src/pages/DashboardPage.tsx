import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Users,
  FileText,
  Image,
  MessageCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Send,
  Smartphone,
  Phone
} from 'lucide-react'

interface DashboardStats {
  totalContacts: number
  totalTemplates: number
  totalMedia: number
  sentMessages: number
  deliveredMessages: number
  failedMessages: number
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalTemplates: 0,
    totalMedia: 0,
    sentMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentMessages, setRecentMessages] = useState([])
  const [whatsappStatus, setWhatsappStatus] = useState({
    web: false,
    api: false
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Get contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Get templates count
      const { count: templatesCount } = await supabase
        .from('message_templates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Get media count
      const { count: mediaCount } = await supabase
        .from('media_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Get message statistics
      const { data: messages } = await supabase
        .from('sent_messages')
        .select('status')
        .eq('user_id', user?.id)

      const sentCount = messages?.filter(m => m.status === 'sent').length || 0
      const deliveredCount = messages?.filter(m => m.status === 'delivered').length || 0
      const failedCount = messages?.filter(m => m.status === 'failed').length || 0

      // Get recent messages
      const { data: recentData } = await supabase
        .from('sent_messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('sent_at', { ascending: false })
        .limit(5)

      // Get WhatsApp connection status
      const { data: sessions } = await supabase
        .from('whatsapp_sessions')
        .select('session_type, is_connected')
        .eq('user_id', user?.id)

      const webSession = sessions?.find(s => s.session_type === 'web')
      const apiSession = sessions?.find(s => s.session_type === 'business_api')

      setStats({
        totalContacts: contactsCount || 0,
        totalTemplates: templatesCount || 0,
        totalMedia: mediaCount || 0,
        sentMessages: sentCount,
        deliveredMessages: deliveredCount,
        failedMessages: failedCount
      })

      setRecentMessages(recentData || [])
      setWhatsappStatus({
        web: webSession?.is_connected || false,
        api: apiSession?.is_connected || false
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            WhatsApp Messaging Platform'unuza hoşgeldiniz
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/dashboard/whatsapp/web"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <Send className="-ml-1 mr-2 h-5 w-5" />
            Mesaj Gönder
          </Link>
        </div>
      </div>

      {/* WhatsApp Connection Status */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            WhatsApp Bağlantı Durumu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center">
                <Smartphone className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">WhatsApp Web</h4>
                  <p className="text-sm text-gray-500">QR kod ile bağlantı</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${
                  whatsappStatus.web ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  whatsappStatus.web ? 'text-green-600' : 'text-red-600'
                }`}>
                  {whatsappStatus.web ? 'Bağlı' : 'Bağlı Değil'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center">
                <Phone className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900">Business API</h4>
                  <p className="text-sm text-gray-500">Resmi API entegrasyonu</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className={`h-3 w-3 rounded-full mr-2 ${
                  whatsappStatus.api ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  whatsappStatus.api ? 'text-green-600' : 'text-red-600'
                }`}>
                  {whatsappStatus.api ? 'Bağlı' : 'Bağlı Değil'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Kişi"
          value={stats.totalContacts}
          icon={Users}
          color="blue"
          href="/dashboard/contacts"
        />
        <StatCard
          title="Mesaj Şablonları"
          value={stats.totalTemplates}
          icon={FileText}
          color="green"
          href="/dashboard/templates"
        />
        <StatCard
          title="Medya Dosyaları"
          value={stats.totalMedia}
          icon={Image}
          color="purple"
          href="/dashboard/media"
        />
        <StatCard
          title="Gönderilen Mesaj"
          value={stats.sentMessages}
          icon={MessageCircle}
          color="indigo"
        />
      </div>

      {/* Message Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Teslim Edilen
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.deliveredMessages}
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
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Bekleyen
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.sentMessages - stats.deliveredMessages - stats.failedMessages}
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
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Başarısız
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.failedMessages}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Hızlı İşlemler
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/dashboard/contacts"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Yeni Kişi Ekle
            </Link>
            <Link
              to="/dashboard/templates"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Yeni Şablon
            </Link>
            <Link
              to="/dashboard/media"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Medya Yükle
            </Link>
            <Link
              to="/dashboard/whatsapp/web"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Send className="-ml-1 mr-2 h-5 w-5" />
              Toplu Mesaj
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      {recentMessages.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Son Mesajlar
            </h3>
            <div className="space-y-3">
              {recentMessages.slice(0, 5).map((message: any) => (
                <div key={message.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 truncate">
                      {message.message_content.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(message.sent_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      message.status === 'sent' ? 'bg-green-100 text-green-800' :
                      message.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                      message.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {message.status === 'sent' ? 'Gönderildi' :
                       message.status === 'delivered' ? 'Teslim Edildi' :
                       message.status === 'failed' ? 'Başarısız' :
                       'Bekleyen'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  href 
}: { 
  title: string
  value: number
  icon: any
  color: string
  href?: string
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100'
  }

  const content = (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value.toLocaleString()}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  return href ? <Link to={href}>{content}</Link> : content
}