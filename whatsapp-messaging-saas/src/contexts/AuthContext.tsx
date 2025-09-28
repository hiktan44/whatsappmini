import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setupDefaultData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on mount (one-time check)
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // NEVER use any async operations in callback
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Auth methods
  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Başarıyla giriş yapıldı!')
    } catch (error: any) {
      toast.error(error.message || 'Giriş yapılırken hata oluştu')
      throw error
    }
  }

  async function signUp(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`
        }
      })
      if (error) throw error
      toast.success('Kayıt başarılı! E-posta adresinizi kontrol edin.')
    } catch (error: any) {
      toast.error(error.message || 'Kayıt olurken hata oluştu')
      throw error
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Başarıyla çıkış yapıldı!')
    } catch (error: any) {
      toast.error(error.message || 'Çıkış yapılırken hata oluştu')
      throw error
    }
  }

  async function setupDefaultData() {
    try {
      const { data, error } = await supabase.functions.invoke('setup-default-data')
      if (error) throw error
      
      if (data?.data?.success) {
        toast.success('Varsayılan veriler başarıyla oluşturuldu!')
      }
    } catch (error: any) {
      console.error('Setup default data error:', error)
      toast.error('Varsayılan veriler oluşturulurken hata oluştu')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setupDefaultData }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}