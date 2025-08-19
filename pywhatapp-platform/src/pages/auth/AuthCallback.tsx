import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashFragment = window.location.hash;

        if (hashFragment && hashFragment.length > 0) {
          // Exchange the auth code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment);

          if (error) {
            console.error('Error exchanging code for session:', error.message);
            toast.error('E-posta doğrulama başarısız');
            navigate('/signin?error=' + encodeURIComponent(error.message));
            return;
          }

          if (data.session) {
            toast.success('E-posta adresiniz başarıyla doğrulandı!');
            navigate('/dashboard');
            return;
          }
        }

        // If we get here, something went wrong
        toast.error('Doğrulama bağlantısı geçersiz');
        navigate('/signin?error=No session found');
        
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Bir hata oluştu');
        navigate('/signin');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            E-posta doğrulanıyor...
          </h2>
          <p className="text-gray-600">
            Lütfen bekleyin, hesabınız etkinleştiriliyor.
          </p>
        </div>
      </div>
    </div>
  );
}
