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
        const { fileData, fileName, fileType } = await req.json();

        if (!fileData || !fileName || !fileType) {
            throw new Error('File data, filename and file type are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${userId}/${timestamp}-${fileName}`;

        // Extract base64 data from data URL
        const base64Data = fileData.split(',')[1];
        const mimeType = fileData.split(';')[0].split(':')[1];

        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to Supabase Storage
        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/whatsapp-media/${uniqueFileName}`, {
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

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/whatsapp-media/${uniqueFileName}`;

        // Save media metadata to database
        const mediaData = {
            user_id: userId,
            filename: uniqueFileName,
            original_name: fileName,
            file_type: fileType,
            file_size: binaryData.length,
            storage_path: uniqueFileName,
            public_url: publicUrl
        };

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/media_files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(mediaData)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Database insert failed: ${errorText}`);
        }

        const mediaRecord = await insertResponse.json();

        return new Response(JSON.stringify({
            data: {
                publicUrl,
                media: mediaRecord[0],
                message: 'Medya dosyası başarıyla yüklendi'
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