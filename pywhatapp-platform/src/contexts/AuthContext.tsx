import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as AuthUser, Session } from '@supabase/supabase-js'
import { supabase, User } from '../lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  profile: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile yükleme fonksiyonu
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      if (!data) {
        // Profile yoksa oluştur
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: user?.email || '',
            role: 'user',
            subscription_plan: 'free',
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
        } else {
          setProfile(newProfile)
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
    }
  }
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
      setLoading(true)
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.warn('Auth error:', error)
        } else {
          setUser(user)
          if (user) {
            await loadProfile(user.id)
            const { data: { session } } = await supabase.auth.getSession()
            setSession(session)
          }
        }
      } catch (error) {
        console.warn('Supabase connection failed:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes - NO ASYNC OPERATIONS IN CALLBACK
    let subscription: any
    try {
      const { data } = supabase.auth.onAuthStateChange(
        (event, session) => {
          // Remove async from callback per best practices
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            // Load profile in a separate async function
            loadProfile(session.user.id).catch(console.error)
          } else {
            setProfile(null)
          }
          if (!session) {
            setLoading(false)
          }
        }
      )
      subscription = data.subscription
    } catch (error) {
      console.warn('Supabase auth listener failed:', error)
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName
          }
        }
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
    setProfile(null)
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
    profile,
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