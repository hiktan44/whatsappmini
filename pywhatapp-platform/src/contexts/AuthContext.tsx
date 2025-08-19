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
        setUser(parsed.user as any)
        setSession({ access_token: parsed.token } as any)
        return true
      } catch (error) {
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
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Admin login event listener
    const handleAdminLogin = (event: any) => {
      const adminSession = event.detail
      setUser(adminSession.user)
      setSession({ access_token: adminSession.token } as any)
    }

    window.addEventListener('admin-login', handleAdminLogin)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('admin-login', handleAdminLogin)
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    // Admin session'ı temizle
    localStorage.removeItem('admin_session')
    
    // Normal Supabase logout
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
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