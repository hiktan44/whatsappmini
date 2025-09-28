import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/components/DashboardLayout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { MediaPage } from '@/pages/MediaPage'
import { WhatsAppWebPage } from '@/pages/WhatsAppWebPage'
import { WhatsAppAPIPage } from '@/pages/WhatsAppAPIPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              {/* Dashboard Routes */}
              <Route index element={<DashboardPage />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="whatsapp/web" element={<WhatsAppWebPage />} />
              <Route path="whatsapp/api" element={<WhatsAppAPIPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App