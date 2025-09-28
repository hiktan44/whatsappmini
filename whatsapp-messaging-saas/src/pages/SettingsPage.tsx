import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  User,
  Lock,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileForm {
  full_name: string
  email: string
  phone?: string
  company_name?: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const profileForm = useForm<ProfileForm>()
  const passwordForm = useForm<PasswordForm>()

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProfile(data)
        profileForm.reset({
          full_name: data.full_name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          company_name: data.company_name || ''
        })
      } else {
        // Create profile if doesn't exist
        const newProfile = {
          user_id: user?.id,
          full_name: user?.email?.split('@')[0] || 'Kullanıcı',
          email: user?.email
        }
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) throw createError
        
        setProfile(createdProfile)
        profileForm.reset({
          full_name: createdProfile.full_name || '',
          email: createdProfile.email || '',
          phone: createdProfile.phone || '',
          company_name: createdProfile.company_name || ''
        })
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      toast.error('Profil yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (formData: ProfileForm) => {
    try {
      setSavingProfile(true)
      
      const updates = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      toast.success('Profil başarıyla güncellendi')
    } catch (error: any) {
      toast.error('Profil güncellenirken hata oluştu')
      console.error('Error updating profile:', error)
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async (formData: PasswordForm) => {
    try {
      setChangingPassword(true)
      
      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      toast.success('Şifre başarıyla güncellendi')
      passwordForm.reset()
    } catch (error: any) {
      toast.error('Şifre güncellenirken hata oluştu')
      console.error('Error changing password:', error)
    } finally {
      setChangingPassword(false)
    }
  }

  const deleteAccount = async () => {
    try {
      // In a real implementation, you would call an edge function to handle account deletion
      // This would need to delete all user data across all tables
      toast.error('Hesap silme özelliği yakında eklenecek')
    } catch (error: any) {
      toast.error('Hesap silinirken hata oluştu')
      console.error('Error deleting account:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Hesap Ayarları
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Profil bilgilerinizi ve güvenlik ayarlarınızı yönetin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <User className="inline-block h-5 w-5 mr-2" />
              Profil Bilgileri
            </h3>
            
            <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                <input
                  {...profileForm.register('full_name', { required: 'Ad soyad gereklidir' })}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
                {profileForm.formState.errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {profileForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                <input
                  {...profileForm.register('email', {
                    required: 'E-posta gereklidir',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir e-posta adresi girin'
                    }
                  })}
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">
                  E-posta adresi değiştirilemez
                </p>
                {profileForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon (Opsiyonel)</label>
                <input
                  {...profileForm.register('phone')}
                  type="tel"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Şirket Adı (Opsiyonel)</label>
                <input
                  {...profileForm.register('company_name')}
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-4 w-4" />
                    Profili Güncelle
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Password Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Lock className="inline-block h-5 w-5 mr-2" />
              Şifre Değiştir
            </h3>
            
            <form onSubmit={passwordForm.handleSubmit(changePassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mevcut Şifre</label>
                <div className="mt-1 relative">
                  <input
                    {...passwordForm.register('currentPassword', { required: 'Mevcut şifre gereklidir' })}
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Yeni Şifre</label>
                <div className="mt-1 relative">
                  <input
                    {...passwordForm.register('newPassword', {
                      required: 'Yeni şifre gereklidir',
                      minLength: {
                        value: 6,
                        message: 'Şifre en az 6 karakter olmalıdır'
                      }
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Yeni Şifre Tekrarı</label>
                <div className="mt-1 relative">
                  <input
                    {...passwordForm.register('confirmPassword', {
                      required: 'Şifre tekrarı gereklidir',
                      validate: value => 
                        value === passwordForm.watch('newPassword') || 'Şifreler eşleşmiyor'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Lock className="-ml-1 mr-2 h-4 w-4" />
                    Şifreyi Güncelle
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-red-900 mb-4">
            <AlertTriangle className="inline-block h-5 w-5 mr-2" />
            Tehlikeli Alan
          </h3>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Hesabı Sil
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Hesabınızı silmek, tüm verilerinizin kalıcı olarak silinmesine neden olur. 
                    Bu işlem geri alınamaz.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="-ml-1 mr-2 h-4 w-4" />
                    Hesabı Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Hesabınızı silmek istediğinizden emin misiniz?
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300"
                  >
                    İptal
                  </button>
                  <button
                    onClick={deleteAccount}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}