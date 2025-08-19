Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { recipients, message, templateId, mediaFiles, userId } = await req.json();
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array is required');
    }
    
    if (!message || message.trim().length === 0) {
      throw new Error('Message content is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }
    
    const results = [];
    
    // Simulate WhatsApp message sending
    for (const recipient of recipients) {
      const { phone, name } = recipient;
      
      // Telefon numarası formatını kontrol et
      let formattedPhone = phone.replace(/[^0-9+]/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+90' + formattedPhone; // Türkiye kodu ekle
      }
      
      // Mesajı kişiselleştir
      let personalizedMessage = message;
      if (name) {
        personalizedMessage = personalizedMessage.replace(/%ad%/g, name);
        personalizedMessage = personalizedMessage.replace(/%isim%/g, name);
      }
      
      // Tarih ve saat değişkenlerini değiştir
      const now = new Date();
      personalizedMessage = personalizedMessage.replace(/%tarih%/g, now.toLocaleDateString('tr-TR'));
      personalizedMessage = personalizedMessage.replace(/%saat%/g, now.toLocaleTimeString('tr-TR'));
      personalizedMessage = personalizedMessage.replace(/%gun%/g, now.getDate().toString());
      personalizedMessage = personalizedMessage.replace(/%ay%/g, (now.getMonth() + 1).toString());
      personalizedMessage = personalizedMessage.replace(/%yil%/g, now.getFullYear().toString());
      
      // Nezaket ifadeleri
      personalizedMessage = personalizedMessage.replace(/%sayin%/g, 'Sayın');
      personalizedMessage = personalizedMessage.replace(/%degerli%/g, 'Değerli');
      personalizedMessage = personalizedMessage.replace(/%kiymetli%/g, 'Kıymetli');
      personalizedMessage = personalizedMessage.replace(/%sevgili%/g, 'Sevgili');
      
      // WhatsApp Web URL oluştur (gerçek integrasyon için)
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(personalizedMessage)}`;
      
      // Mesaj logunu veritabanına kaydet
      const logData = {
        user_id: userId,
        recipient_phone: formattedPhone,
        recipient_name: name || null,
        message_content: personalizedMessage,
        template_id: templateId || null,
        media_files: mediaFiles || null,
        status: 'sent',
        delivery_status: 'delivered', // Demo için
        sent_at: new Date().toISOString()
      };
      
      const logResponse = await fetch(`${supabaseUrl}/rest/v1/message_logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
      
      if (!logResponse.ok) {
        console.error('Failed to log message:', await logResponse.text());
      }
      
      results.push({
        phone: formattedPhone,
        name: name,
        status: 'sent',
        message: personalizedMessage,
        whatsappUrl: whatsappUrl,
        timestamp: new Date().toISOString()
      });
    }
    
    return new Response(JSON.stringify({
      data: {
        success: true,
        results: results,
        totalSent: results.length,
        message: `${results.length} mesaj başarıyla gönderildi`
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('WhatsApp send error:', error);
    
    const errorResponse = {
      error: {
        code: 'WHATSAPP_SEND_FAILED',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});