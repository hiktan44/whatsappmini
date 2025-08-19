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
    const { userId } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }
    
    // Hazır şablonlar
    const defaultTemplates = [
      {
        template_name: 'Hoş Geldiniz Mesajı',
        content: '%sayın% %ad%, platformumuza hoş geldiniz! Size en iyi hizmeti sunmak için buradayız.',
        category: 'general',
        variables: ['%sayın%', '%ad%']
      },
      {
        template_name: 'Randevu Hatırlatması',
        content: '%sayın% %ad%, %tarih% tarihinde saat %saat%\'da randevunuz bulunmaktadır. Lütfen zamanında gelebilirsiniz.',
        category: 'appointment',
        variables: ['%sayın%', '%ad%', '%tarih%', '%saat%']
      },
      {
        template_name: 'Pazarlama Kampanyası',
        content: '%değerli% müşterimiz, özel indirim kampanyamızdan yararlanmak için son %gun% gün! Fırsatı kaçırmayın.',
        category: 'marketing',
        variables: ['%değerli%', '%gun%']
      },
      {
        template_name: 'Teşekkür Mesajı',
        content: '%kıymetli% %ad%, bize olan güveniniz için teşekkür ederiz. Memnuniyetiniz bizim için çok değerlidir.',
        category: 'thanks',
        variables: ['%kıymetli%', '%ad%']
      },
      {
        template_name: 'Doğum Günü Kutlaması',
        content: '%sevgili% %ad%, doğum gününüz kutlu olsun! Size özel indirimli fırsatlarımızı kaçırmayın.',
        category: 'celebration',
        variables: ['%sevgili%', '%ad%']
      },
      {
        template_name: 'Ödeme Hatırlatması',
        content: '%sayın% %ad%, ödeme tarihiniz yaklaşmaktadır. Lütfen %tarih% tarihine kadar ödemenizi gerçekleştirin.',
        category: 'reminder',
        variables: ['%sayın%', '%ad%', '%tarih%']
      },
      {
        template_name: 'Takip Mesajı',
        content: '%değerli% %ad%, hizmetimizden memnuniyetinizi öğrenmek istiyoruz. Geri bildiriminiz bizim için çok önemlidir.',
        category: 'follow-up',
        variables: ['%değerli%', '%ad%']
      }
    ]
    
    // Her şablon için kontrol et ve ekle
    const insertedTemplates = []
    
    for (const template of defaultTemplates) {
      // Aynı isimde şablon var mı kontrol et
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/message_templates?user_id=eq.${userId}&template_name=eq.${encodeURIComponent(template.template_name)}`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      const existingTemplates = await checkResponse.json()
      
      if (existingTemplates.length === 0) {
        // Şablon mevcut değil, ekle
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/message_templates`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: userId,
            ...template
          })
        })
        
        if (insertResponse.ok) {
          const insertedTemplate = await insertResponse.json()
          insertedTemplates.push(insertedTemplate[0])
        }
      }
    }
    
    // Bazı temel değişkenler de ekleyelim
    const defaultVariables = [
      {
        variable_name: 'firma_adi',
        variable_value: 'PyWhatApp',
        description: 'Firma adı'
      },
      {
        variable_name: 'destek_telefon',
        variable_value: '0555 123 4567',
        description: 'Destek telefon numarası'
      },
      {
        variable_name: 'web_sitesi',
        variable_value: 'www.pywhatapp.com',
        description: 'Web sitesi adresi'
      },
      {
        variable_name: 'email',
        variable_value: 'info@pywhatapp.com',
        description: 'E-posta adresi'
      }
    ]
    
    const insertedVariables = []
    
    for (const variable of defaultVariables) {
      // Aynı isimde değişken var mı kontrol et
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/custom_variables?user_id=eq.${userId}&variable_name=eq.${encodeURIComponent(variable.variable_name)}`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      const existingVariables = await checkResponse.json()
      
      if (existingVariables.length === 0) {
        // Değişken mevcut değil, ekle
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/custom_variables`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: userId,
            is_system: false,
            ...variable
          })
        })
        
        if (insertResponse.ok) {
          const insertedVariable = await insertResponse.json()
          insertedVariables.push(insertedVariable[0])
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: `${insertedTemplates.length} şablon ve ${insertedVariables.length} değişken eklendi`,
      templates: insertedTemplates,
      variables: insertedVariables
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Setup Default Data Error:', error)
    return new Response(JSON.stringify({ 
      error: {
        code: 'SETUP_DEFAULT_DATA_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})