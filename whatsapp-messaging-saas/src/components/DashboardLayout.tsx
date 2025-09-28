import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  MessageCircle,
  LayoutDashboard,
  Users,
  FileText,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  Phone,
  Smartphone
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kişiler', href: '/dashboard/contacts', icon: Users },
  { name: 'Şablonlar', href: '/dashboard/templates', icon: FileText },
  { name: 'Medya', href: '/dashboard/media', icon: Image },
  { name: 'Ayarlar', href: '/dashboard/settings', icon: Settings },
]

const whatsappOptions = [
  { name: 'WhatsApp Web', href: '/dashboard/whatsapp/web', icon: Smartphone },
  { name: 'Business API', href: '/dashboard/whatsapp/api', icon: Phone },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth/login')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${
        sidebarOpen ? 'block' : 'hidden'
      }`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent location={location} onSignOut={handleSignOut} user={user} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent location={location} onSignOut={handleSignOut} user={user} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <h1 className="text-2xl font-semibold text-gray-900">
                WhatsApp Messaging Platform
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Hoşgeldiniz,</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.email?.split('@')[0] || 'Kullanıcı'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ 
  location, 
  onSignOut, 
  user 
}: { 
  location: any
  onSignOut: () => void
  user: any
}) {
  return (
    <div className="flex flex-col h-0 flex-1">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-green-600">
        <MessageCircle className="h-8 w-8 text-white" />
        <span className="ml-2 text-white text-lg font-semibold">WhatsApp SaaS</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-white space-y-1">
          {/* Main Navigation */}
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium border-l-4 rounded-r-md`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                />
                {item.name}
              </Link>
            )
          })}

          {/* WhatsApp Section */}
          <div className="pt-6">
            <div className="px-2 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                WhatsApp Entegrasyonu
              </h3>
            </div>
            {whatsappOptions.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium border-l-4 rounded-r-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {user?.email?.split('@')[0] || 'Kullanıcı'}
                </p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}