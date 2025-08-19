import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../services/api'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Admin session kontrolü
  const checkAdminSession = () => {
    const adminSession = localStorage.getItem('admin_session')
    if (adminSession) {
      try {
        const parsed = JSON.parse(adminSession)
        // Session süresi kontrolü (24 saat)
        if (parsed.loginTime) {
          const loginTime = new Date(parsed.loginTime)
          const now = new Date()
          const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
          
          if (hoursDiff > 24) {
            localStorage.removeItem('admin_session')
            return false
          }
        }
        
        setUser({
          ...parsed.user,
          id: parsed.user.id,
          email: parsed.user.email,
          user_metadata: {
            name: parsed.user.name || 'Admin User',
            role: parsed.user.role || 'admin'
          }
        } as any)
        setSession({ 
          access_token: parsed.token,
          user: parsed.user 
        } as any)
        return true
      } catch (error) {
        console.error('Admin session parse error:', error)
        localStorage.removeItem('admin_session')
      }
    }
    return false
  }

  useEffect(() => {
    // İlk önce admin session kontrol et
    if (checkAdminSession()) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('Supabase session error (using fallback):', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.warn('Supabase connection failed (using fallback auth):', error)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    let subscription: any
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )
      subscription = data.subscription
    } catch (error) {
      console.warn('Supabase auth listener failed (using fallback):', error)
    }

    // Admin login event listener
    const handleAdminLogin = (event: any) => {
      const adminSession = event.detail
      setUser(adminSession.user)
      setSession({ access_token: adminSession.token } as any)
    }

    window.addEventListener('admin-login', handleAdminLogin)

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe()
      }
      window.removeEventListener('admin-login', handleAdminLogin)
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      if (error.message?.includes('not configured')) {
        throw new Error('Kayıt sistemi şu anda kullanılamıyor. Lütfen admin girişi kullanın.')
      }
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      if (error.message?.includes('not configured')) {
        throw new Error('Giriş sistemi şu anda kullanılamıyor. Lütfen admin girişi kullanın.')
      }
      throw error
    }
  }

  const signOut = async () => {
    // Admin session'ı temizle
    localStorage.removeItem('admin_session')
    
    // Normal Supabase logout
    try {
      const { error } = await supabase.auth.signOut()
      if (error && !error.message?.includes('not configured')) {
        throw error
      }
    } catch (error: any) {
      console.warn('Supabase signOut error:', error)
    }
    
    // State'i sıfırla
    setUser(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider