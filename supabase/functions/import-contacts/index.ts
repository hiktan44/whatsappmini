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
    const { csvData, userId, groupName } = await req.json();

    if (!csvData || !userId) {
      throw new Error('CSV data and user ID are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // CSV verisini parse et
    const lines = csvData.trim().split('\n');
    const contacts = [];
    const errors = [];
    
    // Header satırını kontrol et (iŞle)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // İlk satırı atla (header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      
      // En az ad ve telefon olmalı
      if (values.length < 2) {
        errors.push(`Satır ${i + 1}: Yetersiz veri`);
        continue;
      }
      
      const name = values[0]?.replace(/"/g, '').trim();
      const phone = values[1]?.replace(/"/g, '').trim();
      
      if (!name || !phone) {
        errors.push(`Satır ${i + 1}: Ad ve telefon gerekli`);
        continue;
      }
      
      // Telefon numarası formatını kontrol et
      let formattedPhone = phone.replace(/[^0-9+]/g, '');
      if (!formattedPhone.startsWith('+')) {
        // Türkiye için +90 ekle
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+90' + formattedPhone.substring(1);
        } else {
          formattedPhone = '+90' + formattedPhone;
        }
      }
      
      if (formattedPhone.length < 10) {
        errors.push(`Satır ${i + 1}: Geçersiz telefon numarası: ${phone}`);
        continue;
      }
      
      contacts.push({
        user_id: userId,
        name: name,
        phone_number: formattedPhone,
        email: values[2]?.replace(/"/g, '').trim() || null,
        notes: values[3]?.replace(/"/g, '').trim() || null,
        tags: groupName ? [groupName] : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    if (contacts.length === 0) {
      throw new Error('Hiçbir geçerli kişi bulunamadı');
    }
    
    // Toplu kişi ekleme
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(contacts)
    });
    
    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Database insert failed: ${errorText}`);
    }
    
    const insertedContacts = await insertResponse.json();
    
    return new Response(JSON.stringify({
      data: {
        success: true,
        totalProcessed: lines.length - 1, // Header satırını çıkar
        successCount: insertedContacts.length,
        errorCount: errors.length,
        errors: errors,
        contacts: insertedContacts
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Contact import error:', error);
    
    const errorResponse = {
      error: {
        code: 'CONTACT_IMPORT_FAILED',
        message: error.message
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});