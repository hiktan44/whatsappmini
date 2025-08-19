import { Settings as SettingsIcon, User, Bell, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">
          Hesap bilgilerinizi ve uygulama ayarlarınızı yönetin.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-[#25D366] bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
              <User className="w-6 h-6 text-[#25D366]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Ad, soyad, e-posta adresinizi ve profil fotoğrafınızı düzenleyin.
          </p>
          <Button variant="outline" size="sm">
            Düzenle
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
              <Bell className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Bildirimler</h3>
          </div>
          <p className="text-gray-600 mb-4">
            E-posta ve uygulama bildirim tercihlerinizi ayarlayın.
          </p>
          <Button variant="outline" size="sm">
            Ayarla
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
              <CreditCard className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Abonelik</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Mevcut planınızı görün ve plan değiştirin.
          </p>
          <Button variant="outline" size="sm">
            Planları Gör
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-500 bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Güvenlik</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Şifrenizi değiştirin ve güvenlik ayarlarınızı yönetin.
          </p>
          <Button variant="outline" size="sm">
            Güvenlik
          </Button>
        </div>
      </div>
    </div>
  );
}
