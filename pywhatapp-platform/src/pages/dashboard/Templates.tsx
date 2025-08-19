import { Button } from '@/components/ui/Button';
import { FileText, Plus, Copy, Edit } from 'lucide-react';

export default function Templates() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Şablonlar</h1>
          <p className="text-gray-600 mt-1">
            Mesaj şablonlarınızı oluşturun ve yönetin.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Şablon
        </Button>
      </div>

      {/* Variable Helper */}
      <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-3">Kullanılabilir Değişkenler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium mb-2">Kişi Bilgileri:</p>
            <ul className="space-y-1 text-white text-opacity-90">
              <li>%ad% - İsim</li>
              <li>%fullname% - Tam ad</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Tarih Bilgileri:</p>
            <ul className="space-y-1 text-white text-opacity-90">
              <li>%tarih% - Bugünün tarihi</li>
              <li>%gun% - Gün</li>
              <li>%ay% - Ay</li>
              <li>%yil% - Yıl</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Hitap Şekilleri:</p>
            <ul className="space-y-1 text-white text-opacity-90">
              <li>%sayın% - Sayın</li>
              <li>%değerli% - Değerli</li>
              <li>%kıymetli% - Kıymetli</li>
              <li>%sevgili% - Sevgili</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Özel Değişkenler:</p>
            <p className="text-white text-opacity-90 text-xs">
              Kendi değişkenlerinizi tanımlayabilirsiniz
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz şablon yok</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Mesaj şablonları oluşturarak kampanyalarınızı hızlandırın.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            İlk Şablonunuzu Oluşturun
          </Button>
        </div>
      </div>
    </div>
  );
}
