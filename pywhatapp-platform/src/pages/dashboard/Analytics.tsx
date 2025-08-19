import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-gray-900">Analitikler</h1>
        <p className="text-gray-600 mt-1">
          Kampanya performansınızı analiz edin ve raporlarınızı inceleyin.
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analitik veriler yok</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Kampanya göndermeye başladığınızda burada detaylı analitikler göreceksiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
