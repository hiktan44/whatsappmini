Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { action, userId, settings } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }
    
    if (action === 'save_settings') {
      // API ayarlarını kaydet
      if (!settings) {
        throw new Error('Settings required')
      }
      
      // Mevcut ayarları kontrol et
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_business_api_settings?user_id=eq.${userId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      })
      
      const existingSettings = await checkResponse.json()
      
      if (existingSettings.length > 0) {
        // Mevcut ayarları güncelle
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_business_api_settings?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            api_key: settings.apiKey,
            phone_number_id: settings.phoneNumberId,
            access_token: settings.accessToken,
            is_active: settings.isActive,
            updated_at: new Date().toISOString()
          })
        })
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update settings')
        }
      } else {
        // Yeni ayarlar oluştur
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_business_api_settings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: userId,
            api_key: settings.apiKey,
            phone_number_id: settings.phoneNumberId,
            access_token: settings.accessToken,
            is_active: settings.isActive
          })
        })
        
        if (!insertResponse.ok) {
          throw new Error('Failed to create settings')
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'API ayarları başarıyla kaydedildi' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'get_settings') {
      // API ayarlarını getir
      const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_business_api_settings?user_id=eq.${userId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      const settings = await response.json()
      const userSettings = settings[0] || {
        api_key: '',
        phone_number_id: '',
        access_token: '',
        is_active: false
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        settings: {
          apiKey: userSettings.api_key || '',
          phoneNumberId: userSettings.phone_number_id || '',
          accessToken: userSettings.access_token || '',
          isActive: userSettings.is_active || false
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'test_connection') {
      // API bağlantısını test et
      if (!settings || !settings.accessToken || !settings.phoneNumberId) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'API ayarları eksik' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      try {
        // WhatsApp Business API test isteği
        const testResponse = await fetch(`https://graph.facebook.com/v18.0/${settings.phoneNumberId}`, {
          headers: {
            'Authorization': `Bearer ${settings.accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (testResponse.ok) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'API bağlantısı başarılı' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'API bağlantısı başarısız' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (testError) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'API test hatası: ' + testError.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    
    if (action === 'send_message') {
      // Business API ile mesaj gönder
      const { phoneNumber, message, mediaUrl } = settings
      
      if (!phoneNumber || !message) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Telefon numarası ve mesaj gerekli' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Kullanıcının API ayarlarını al
      const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_business_api_settings?user_id=eq.${userId}&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      const userSettings = await settingsResponse.json()
      const apiSettings = userSettings[0]
      
      if (!apiSettings || !apiSettings.is_active) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'WhatsApp Business API aktif değil' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      try {
        // WhatsApp Business API mesaj gönderimi
        const messageData: any = {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: {
            body: message
          }
        }
        
        if (mediaUrl) {
          // Medya gönderimi için type'ı güncelle
          messageData.type = "image" // Bu gerçek implementasyonda media tipine göre değişmeli
          messageData.image = {
            link: mediaUrl
          }
          delete messageData.text
        }
        
        const sendResponse = await fetch(`https://graph.facebook.com/v18.0/${apiSettings.phone_number_id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiSettings.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageData)
        })
        
        const result = await sendResponse.json()
        
        if (sendResponse.ok) {
          // Mesaj logunu kaydet
          await fetch(`${supabaseUrl}/rest/v1/message_logs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              recipient_phone: phoneNumber,
              message_content: message,
              status: 'sent',
              delivery_status: 'pending',
              media_files: mediaUrl ? [mediaUrl] : []
            })
          })
          
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Mesaj başarıyla gönderildi',
            messageId: result.messages?.[0]?.id
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Mesaj gönderilemedi: ' + result.error?.message
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (sendError) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Mesaj gönderme hatası: ' + sendError.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('WhatsApp Business API Error:', error)
    return new Response(JSON.stringify({ 
      error: {
        code: 'WHATSAPP_BUSINESS_API_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})