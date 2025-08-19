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
    
    if (action === 'import_contacts') {
      // Kişi aktarım işlemi
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      
      // Önce bağlantı durumunu kontrol et
      const statusResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_connections?user_id=eq.${userId}&connection_type=eq.web&connection_status=eq.connected`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      const connections = await statusResponse.json()
      if (!connections || connections.length === 0) {
        throw new Error('WhatsApp Web bağlantısı bulunamadı')
      }
      
      // Gerçekçi kişi listesi oluştur (gerçek implementasyonda WhatsApp Web API'si kullanılır)
      const simulatedContacts = [
        { name: 'Ali Veli', phone: '+905551234567', lastSeen: '2 dakika önce', avatar: null },
        { name: 'Ayşe Fatma', phone: '+905559876543', lastSeen: '5 dakika önce', avatar: null },
        { name: 'Mehmet Can', phone: '+905555555555', lastSeen: '1 saat önce', avatar: null },
        { name: 'Zeynep Nur', phone: '+905557777777', lastSeen: '3 saat önce', avatar: null },
        { name: 'Burak Özkan', phone: '+905558888888', lastSeen: 'dün', avatar: null },
        { name: 'Elif Güler', phone: '+905559999999', lastSeen: '2 gün önce', avatar: null },
        { name: 'Oğuz Kaya', phone: '+905554444444', lastSeen: '1 hafta önce', avatar: null },
        { name: 'Selin Demir', phone: '+905553333333', lastSeen: '2 hafta önce', avatar: null },
        { name: 'Emre Yıldız', phone: '+905552222222', lastSeen: '1 ay önce', avatar: null },
        { name: 'Merve Aslan', phone: '+905551111111', lastSeen: '2 ay önce', avatar: null }
      ]
      
      // Mevcut kişileri kontrol et (duplikasyon önleme)
      const existingContactsResponse = await fetch(`${supabaseUrl}/rest/v1/contacts?user_id=eq.${userId}&select=phone_number`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      const existingContacts = await existingContactsResponse.json()
      const existingPhones = new Set(existingContacts.map((c: any) => c.phone_number))
      
      // Yeni kişileri filtrele
      const newContacts = simulatedContacts.filter(contact => 
        !existingPhones.has(contact.phone)
      )
      
      if (newContacts.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Tüm kişiler zaten mevcut',
          importedCount: 0,
          skippedCount: simulatedContacts.length,
          totalFound: simulatedContacts.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Yeni kişileri veritabanına ekle
      const contactsToInsert = newContacts.map(contact => ({
        user_id: userId,
        name: contact.name,
        phone_number: contact.phone,
        notes: `WhatsApp'tan aktarıldı - Son görülme: ${contact.lastSeen}`,
        tags: ['whatsapp-import'],
        created_at: new Date().toISOString()
      }))
      
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(contactsToInsert)
      })
      
      if (!insertResponse.ok) {
        const errorText = await insertResponse.text()
        throw new Error(`Kişi aktarımı başarısız: ${errorText}`)
      }
      
      const insertedContacts = await insertResponse.json()
      
      return new Response(JSON.stringify({
        success: true,
        message: `${newContacts.length} kişi başarıyla aktarıldı`,
        importedCount: newContacts.length,
        skippedCount: simulatedContacts.length - newContacts.length,
        totalFound: simulatedContacts.length,
        contacts: insertedContacts
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