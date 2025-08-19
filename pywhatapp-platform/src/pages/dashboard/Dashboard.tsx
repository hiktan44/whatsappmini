import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats } from '@/hooks/useAnalytics';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  Send, 
  Users, 
  MessageCircle, 
  TrendingUp,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, change, changeType, icon: Icon, color, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 flex items-center ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${
                changeType === 'decrease' ? 'rotate-180' : ''
              }`} />
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

function QuickAction({ title, description, icon: Icon, href, color }: QuickActionProps) {
  return (
    <Link to={href}>
      <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg hover:border-[#25D366] transition-all cursor-pointer group">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color} mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </Link>
  );
}

function RecentCampaigns() {
  const { data: campaigns, isLoading } = useCampaigns();
  const recentCampaigns = campaigns?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Son Kampanyalar</h3>
        </div>
        <div className="p-6">
          <LoadingSpinner className="h-20" />
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'running': return 'Çalışıyor';
      case 'failed': return 'Başarısız';
      case 'draft': return 'Taslak';
      case 'paused': return 'Duraklatıldı';
      default: return status;
    }
  };

  if (recentCampaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Son Kampanyalar</h3>
          <Link to="/campaigns">
            <Button variant="outline" size="sm">
              Tümünü Gör
            </Button>
          </Link>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Henüz kampanya oluşturmadınız</p>
            <Link to="/campaigns">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                İlk Kampanyanızı Oluşturun
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Son Kampanyalar</h3>
        <Link to="/campaigns">
          <Button variant="outline" size="sm">
            Tümünü Gör
          </Button>
        </Link>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recentCampaigns.map((campaign) => (
            <div key={campaign.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(campaign.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                <p className="text-sm text-gray-500">
                  {campaign.total_contacts} kişi • {campaign.sent_count} gönderildi
                </p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400">
                    {getStatusText(campaign.status)}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(campaign.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const statsData = [
    {
      title: 'Toplam Kampanya',
      value: stats?.totalCampaigns?.toString() || '0',
      change: undefined,
      changeType: 'increase' as const,
      icon: Send,
      color: 'bg-[#25D366]'
    },
    {
      title: 'Kişi Sayısı',
      value: stats?.totalContacts?.toString() || '0',
      change: undefined,
      changeType: 'increase' as const,
      icon: Users,
      color: 'bg-[#128C7E]'
    },
    {
      title: 'Gönderilen Mesaj',
      value: stats?.totalMessages?.toString() || '0',
      change: undefined,
      changeType: 'increase' as const,
      icon: MessageCircle,
      color: 'bg-[#34B7F1]'
    },
    {
      title: 'Başarı Oranı',
      value: `%${stats?.successRate || 0}`,
      change: undefined,
      changeType: 'increase' as const,
      icon: BarChart3,
      color: 'bg-green-500'
    }
  ];

  const quickActions = [
    {
      title: 'Yeni Kampanya',
      description: 'Toplu mesaj kampanyası oluştur',
      icon: Send,
      href: '/campaigns',
      color: 'bg-[#25D366]'
    },
    {
      title: 'Kişi Ekle',
      description: 'Yeni kişi veya grup ekle',
      icon: Users,
      href: '/contacts',
      color: 'bg-[#128C7E]'
    },
    {
      title: 'Şablon Oluştur',
      description: 'Mesaj şablonu hazırla',
      icon: MessageCircle,
      href: '/templates',
      color: 'bg-[#34B7F1]'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-gray-900">
          Hoş geldiniz, {profile?.full_name?.split(' ')[0] || 'Kullanıcı'}!
        </h1>
        <p className="text-gray-600 mt-1">
          WhatsApp pazarlama kampanyalarınızı buradan yönetebilirsiniz.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} loading={statsLoading} />
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <QuickAction key={index} {...action} />
              ))}
            </div>
          </div>

          {/* Recent Campaigns */}
          <RecentCampaigns />
        </div>

        {/* Recent Activity - Bu kısım şimdilik basit tutuldu */}
        <div>
          <div className="bg-white rounded-xl border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h3>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Aktivite geçmişi yakında eklenecek</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      {profile?.subscription_plan === 'free' && (
        <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Planınızı Yükseltmek İster misiniz?</h3>
              <p className="text-white text-opacity-90 text-sm">
                Pro plana geçerek daha fazla mesaj gönderme hakkı ve gelişmiş özelliklere erişin.
              </p>
            </div>
            <Button variant="outline" className="bg-white text-[#25D366] hover:bg-gray-100 border-white">
              Planı Yükselt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
