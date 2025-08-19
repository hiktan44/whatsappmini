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
    const { action, userId } = await req.json()
    
    if (action === 'generate_qr') {
      // QR kod üretme simülasyonu
      const qrCodeData = `whatsapp-qr-${userId}-${Date.now()}`
      
      // Veritabanına bağlantı durumu kaydet
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing')
      }
      
      // Mevcut bağlantıyı kontrol et
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${userId}&connection_type=eq.web&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      })
      
      const existingConnections = await checkResponse.json()
      
      if (existingConnections.length > 0) {
        // Mevcut bağlantıyı güncelle
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${userId}&connection_type=eq.web`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            connection_status: 'connecting',
            qr_code_data: qrCodeData,
            updated_at: new Date().toISOString()
          })
        })
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update connection')
        }
      } else {
        // Yeni bağlantı oluştur
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: userId,
            connection_type: 'web',
            connection_status: 'connecting',
            qr_code_data: qrCodeData
          })
        })
        
        if (!insertResponse.ok) {
          throw new Error('Failed to create connection')
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        qrCode: qrCodeData,
        message: 'QR kod oluşturuldu' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'connect') {
      // WhatsApp Web bağlantısı simülasyonu
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${userId}&connection_type=eq.web`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connection_status: 'connected',
          last_connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      })
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update connection status')
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'WhatsApp Web bağlantısı kuruldu' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'disconnect') {
      // WhatsApp Web bağlantısını kes
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${userId}&connection_type=eq.web`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connection_status: 'disconnected',
          qr_code_data: null,
          updated_at: new Date().toISOString()
        })
      })
      
      if (!updateResponse.ok) {
        throw new Error('Failed to disconnect')
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'WhatsApp Web bağlantısı kesildi' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    if (action === 'status') {
      // Bağlantı durumunu kontrol et
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${userId}&connection_type=eq.web&select=*`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      const connections = await response.json()
      const connection = connections[0] || { connection_status: 'disconnected', qr_code_data: null }
      
      return new Response(JSON.stringify({ 
        success: true, 
        status: connection.connection_status,
        qrCode: connection.qr_code_data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('WhatsApp Web Connect Error:', error)
    return new Response(JSON.stringify({ 
      error: {
        code: 'WHATSAPP_WEB_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})