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
    const { fileData, fileName, fileType, userId } = await req.json();

    if (!fileData || !fileName || !userId) {
      throw new Error('File data, filename and user ID are required');
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }

    // Base64 veriyi binary'ye çevir
    const base64Data = fileData.split(',')[1];
    const mimeType = fileData.split(';')[0].split(':')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Dosya boyutunu kontrol et (50MB limit)
    if (binaryData.length > 52428800) {
      throw new Error('Dosya boyutu 50MB\'dan büyük olamaz');
    }

    // Güvenli dosya adı oluştur
    const timestamp = Date.now();
    const safeFileName = `${userId}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Dosyayı Supabase Storage'a yükle
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/pywhatapp-media/${safeFileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: binaryData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    // Public URL oluştur
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/pywhatapp-media/${safeFileName}`;

    // Medya dosyası metadata'sini veritabanına kaydet
    const mediaData = {
      user_id: userId,
      file_name: fileName,
      file_type: fileType || mimeType.split('/')[0],
      file_url: publicUrl,
      file_size: binaryData.length,
      mime_type: mimeType,
      created_at: new Date().toISOString()
    };

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/media_files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(mediaData)
    });

    if (!dbResponse.ok) {
      const errorText = await dbResponse.text();
      console.error('Database insert failed:', errorText);
      // Dosya yüklendi ama DB'ye kayıt başarısız, yine de başarılı say
    }

    const savedMedia = await dbResponse.json();

    return new Response(JSON.stringify({
      data: {
        id: savedMedia[0]?.id || null,
        publicUrl: publicUrl,
        fileName: fileName,
        fileType: fileType || mimeType.split('/')[0],
        fileSize: binaryData.length,
        mimeType: mimeType,
        uploadedAt: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Media upload error:', error);

    const errorResponse = {
      error: {
        code: 'MEDIA_UPLOAD_FAILED',
        message: error.message
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});