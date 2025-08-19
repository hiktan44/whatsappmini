import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const Login: React.FC = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Admin bypass kontrolü - Environment variables'dan al
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@pywhatapp.com'
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
      
      if (email === adminEmail && password === adminPassword) {
        // Admin için localStorage session oluştur
        const adminSession = {
          user: {
            id: 'admin-user',
            email: adminEmail,
            role: 'admin',
            name: 'System Administrator'
          },
          token: 'admin-token-' + Date.now(),
          loginTime: new Date().toISOString(),
          isAdmin: true
        }
        localStorage.setItem('admin_session', JSON.stringify(adminSession))
        
        // AuthContext'i güncellemek için custom event dispatch et
        window.dispatchEvent(new CustomEvent('admin-login', { detail: adminSession }))
        
        toast.success('Admin girişi başarılı! Dashboard\'a yönlendiriliyorsunuz...')
        setLoading(false)
        
        // 1 saniye sonra redirect
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
        return
      }

      // Normal Supabase auth deneme
      try {
        await signIn(email, password)
        toast.success('Başarıyla giriş yapıldı!')
      } catch (supabaseError: any) {
        // Supabase hatası durumunda alternatif demo login kontrolü
        if (email.includes('demo') || password === 'demo123') {
          const demoSession = {
            user: {
              id: 'demo-user',
              email: email,
              role: 'user',
              name: 'Demo User'
            },
            token: 'demo-token-' + Date.now(),
            loginTime: new Date().toISOString(),
            isDemo: true
          }
          localStorage.setItem('admin_session', JSON.stringify(demoSession))
          window.dispatchEvent(new CustomEvent('admin-login', { detail: demoSession }))
          toast.success('Demo girişi başarılı!')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1000)
          return
        }
        
        throw supabaseError
      }
    } catch (error: any) {
      toast.error('Giriş başarısız: ' + (error.message || 'Bilinmeyen hata'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hesabınıza giriş yapın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Veya{' '}
            <Link
              to="/register"
              className="font-medium text-green-600 hover:text-green-500"
            >
              yeni hesap oluşturun
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Admin Giriş İpucu */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Admin Girişi
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  <strong>Email:</strong> admin@pywhatapp.com<br/>
                  <strong>Şifre:</strong> admin123<br/>
                  <em className="text-blue-600">Demo için: demo@test.com / demo123</em>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                E-posta adresi
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="E-posta adresi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Giriş Yap
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login