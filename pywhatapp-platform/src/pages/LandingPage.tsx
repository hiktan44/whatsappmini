import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Users, 
  Zap, 
  Shield, 
  BarChart3, 
  Smartphone,
  CheckCircle,
  Star,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: MessageCircle,
      title: 'Toplu Mesaj Gönderimi',
      description: 'Binlerce kişiye tek seferde kişiselleştirilmiş WhatsApp mesajları gönderin'
    },
    {
      icon: Users,
      title: 'Kişi Yönetimi',
      description: 'Kişilerinizi gruplar halinde organize edin ve etkili bir şekilde yönetin'
    },
    {
      icon: Zap,
      title: 'Akıllı Değişkenler',
      description: 'Mesajlarınızı %ad%, %tarih% gibi dinamik değişkenlerle kişiselleştirin'
    },
    {
      icon: Shield,
      title: 'Güvenli ve Gizli',
      description: 'Tüm verileriniz şifrelenir, kişisel bilgileriniz güvende kalır'
    },
    {
      icon: BarChart3,
      title: 'Detaylı Raporlar',
      description: 'Mesaj gönderim istatistiklerinizi takip edin ve performansınızı analiz edin'
    },
    {
      icon: Smartphone,
      title: 'Mobil Uyumlu',
      description: 'Her cihazdan erişim sağlayın, mobil deneyimden ödün vermeyin'
    }
  ];

  const plans = [
    {
      name: 'Ücretsiz',
      price: '0',
      period: '/ay',
      description: 'Bireysel kullanım için ideal',
      features: [
        '50 mesaj/ay',
        '100 kişi',
        'Temel şablonlar',
        'E-posta desteği'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '299',
      period: '/ay',
      description: 'Küçük işletmeler için',
      features: [
        '5.000 mesaj/ay',
        'Sınırsız kişi',
        'Özel değişkenler',
        'Medya gönderimi',
        'Öncelikli destek',
        'Gelişmiş raporlar'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '999',
      period: '/ay',
      description: 'Büyük şirketler için',
      features: [
        'Sınırsız mesaj',
        'Sınırsız kişi',
        'API entegrasyonu',
        'Özel integrasyonlar',
        '7/24 telefon desteği',
        'Özel eğitim'
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Ahmet Demir',
      role: 'E-ticaret Müdürü',
      company: 'TechStore',
      content: 'PyWhatApp sayesinde müşterilerimize toplu kampanya mesajları gönderiyoruz. Satışlarımız %40 arttı!',
      rating: 5
    },
    {
      name: 'Zeynep Kaya',
      role: 'Pazarlama Uzmanı', 
      company: 'FashionBrand',
      content: 'Kişiselleştirilmiş mesajlar ve kolay kullanım arayüzü gerçekten harika. Kesinlikle tavsiye ederim.',
      rating: 5
    },
    {
      name: 'Mehmet Özkan',
      role: 'Girişimci',
      company: 'StartupCo',
      content: 'Ücretsiz plan bile ihtiyaçlarımızı karşılıyor. Büyüdükçe Pro plana geçmeyi planlıyoruz.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">PyWhatApp</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-[#25D366] transition-colors">Özellikler</a>
              <a href="#pricing" className="text-gray-600 hover:text-[#25D366] transition-colors">Fiyatlar</a>
              <a href="#testimonials" className="text-gray-600 hover:text-[#25D366] transition-colors">Yorumlar</a>
              <Link to="/signin" className="text-gray-600 hover:text-[#25D366] transition-colors">Giriş</Link>
              <Link to="/signup">
                <Button>Ücretsiz Başla</Button>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-[#25D366] transition-colors">Özellikler</a>
                <a href="#pricing" className="text-gray-600 hover:text-[#25D366] transition-colors">Fiyatlar</a>
                <a href="#testimonials" className="text-gray-600 hover:text-[#25D366] transition-colors">Yorumlar</a>
                <Link to="/signin" className="text-gray-600 hover:text-[#25D366] transition-colors">Giriş</Link>
                <Link to="/signup">
                  <Button className="w-full">Ücretsiz Başla</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              WhatsApp ile
              <span className="text-[#25D366] block">Toplu Mesaj Gönderimi</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Müşterilerinize kişiselleştirilmiş WhatsApp mesajları gönderin. 
              Satışlarınızı artırın, müşteri memnuniyetinizi yükseltin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 py-4">
                  Ücretsiz Başla
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Demo İzle
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Kredi kartı gerektirmez • 5 dakikada kurulum • 7/24 destek
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Güçlü Özellikler
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              PyWhatApp ile WhatsApp pazarlamanızı profesyonel seviyeye çıkarın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 hover:border-[#25D366] transition-all duration-300 hover:shadow-lg">
                <div className="w-12 h-12 bg-[#25D366] bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#25D366]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Basit ve Şeffaf Fiyatlandırma
            </h2>
            <p className="text-xl text-gray-600">
              İhtiyacınıza göre plan seçin, istediğiniz zaman değiştirin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl p-8 border-2 transition-all duration-300 hover:shadow-lg ${
                plan.popular 
                  ? 'border-[#25D366] transform scale-105' 
                  : 'border-gray-100 hover:border-[#25D366]'
              }`}>
                {plan.popular && (
                  <div className="bg-[#25D366] text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                    En Popüler
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}₺</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[#25D366] mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button 
                    variant={plan.popular ? 'default' : 'outline'} 
                    className="w-full"
                  >
                    {plan.name === 'Ücretsiz' ? 'Ücretsiz Başla' : 'Planı Seç'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Müşterilerimiz Ne Diyor?
            </h2>
            <p className="text-xl text-gray-600">
              Binlerce memnun kullanıcımızdan bazı yorumlar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#25D366] to-[#128C7E]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Bugün Başla, Farkı Hemen Gör
          </h2>
          <p className="text-xl text-white text-opacity-90 mb-8 max-w-3xl mx-auto">
            Dakikalar içinde kurulum yapın ve ilk kampanyanızı başlatın. 
            Ücretsiz deneme sürümü ile risk almadan test edin.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="outline" className="bg-white text-[#25D366] hover:bg-gray-100 border-white text-lg px-8 py-4">
              Ücretsiz Hesap Oluştur
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">PyWhatApp</span>
              </div>
              <p className="text-gray-400">
                WhatsApp pazarlamasında yeni nesil çözümler
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ürün</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fiyatlar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Entegrasyonlar</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dokümantasyon</a></li>
                <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Durum</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Şirket</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kariyer</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gizlilik</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PyWhatApp. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
