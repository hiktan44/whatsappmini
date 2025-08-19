import { Button } from '@/components/ui/Button';
import { Image, Upload, Plus, Grid, List } from 'lucide-react';

export default function MediaLibrary() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medya Kütüphanesi</h1>
          <p className="text-gray-600 mt-1">
            Resim, video, ses ve belge dosyalarınızı yönetin.
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Dosya Yükle
        </Button>
      </div>

      {/* File Types */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resimler</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 bg-[#25D366] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-[#25D366]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Videolar</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ses Dosyaları</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Belgeler</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-10 h-10 bg-orange-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Medya kütüphaneniz boş</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Resim, video, ses dosyaları ve belgeler yükleyerek medya kütüphanenizi oluşturun.
          </p>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            İlk Dosyanızı Yükleyin
          </Button>
        </div>
      </div>
    </div>
  );
}
