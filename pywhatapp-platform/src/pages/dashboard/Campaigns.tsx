import { Button } from '@/components/ui/Button';
import { Send, Plus, Filter, Search } from 'lucide-react';

export default function Campaigns() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kampanyalar</h1>
          <p className="text-gray-600 mt-1">
            WhatsApp mesaj kampanyalarınızı oluşturun ve yönetin.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Kampanya ara..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
              />
            </div>
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="text-center py-12">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kampanya yok</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            İlk WhatsApp kampanyanızı oluşturarak müşterilerinize ulaşmaya başlayın.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            İlk Kampanyanızı Oluşturun
          </Button>
        </div>
      </div>
    </div>
  );
}
