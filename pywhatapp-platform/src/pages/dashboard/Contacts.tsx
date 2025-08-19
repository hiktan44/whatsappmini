import { Button } from '@/components/ui/Button';
import { Users, Plus, Upload, Download } from 'lucide-react';

export default function Contacts() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kişiler</h1>
          <p className="text-gray-600 mt-1">
            WhatsApp kişilerini yönetin ve gruplarınızı organize edin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            İçe Aktar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kişi
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Kişi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 bg-[#25D366] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#25D366]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Kişi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Grup Sayısı</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Kişi listeniz boş</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Kişileri tek tek ekleyebilir veya Excel dosyasından toplu olarak içe aktarabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Excel'den İçe Aktar
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Manuel Kişi Ekle
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
