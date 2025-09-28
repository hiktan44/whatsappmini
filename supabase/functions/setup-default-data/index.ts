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

        // Default message templates
        const defaultTemplates = [
            {
                user_id: userId,
                name: 'Hoşgeldin Mesajı',
                content: 'Merhaba %ad%! %company% ailesine hoş geldiniz. Size nasıl yardımcı olabiliriz?',
                category: 'İş',
                is_default: true,
                variables: ['%ad%', '%company%']
            },
            {
                user_id: userId,
                name: 'Randevu Hatırlatması',
                content: 'Sayın %ad% %soyad%, %tarih% tarihinde saat %saat% randevunuz bulunmaktadır. Lütfen zamanında gelmek için hazırlıklarınızı yapınız.',
                category: 'Sağlık',
                is_default: true,
                variables: ['%ad%', '%soyad%', '%tarih%', '%saat%']
            },
            {
                user_id: userId,
                name: 'Ders Duyurusu',
                content: 'Sevgili %ad%, %kurs_adi% kursunuz %tarih% tarihinde %saat% saatinde başlayacaktır. Derslik: %derslik%',
                category: 'Eğitim',
                is_default: true,
                variables: ['%ad%', '%kurs_adi%', '%tarih%', '%saat%', '%derslik%']
            },
            {
                user_id: userId,
                name: 'Özel Teklif',
                content: 'Merhaba %ad%! Sizin için özel bir teklifimiz var. %urun_adi% ürünümüzde %indirim_orani% indirim! Son tarih: %son_tarih%',
                category: 'Pazarlama',
                is_default: true,
                variables: ['%ad%', '%urun_adi%', '%indirim_orani%', '%son_tarih%']
            },
            {
                user_id: userId,
                name: 'Doğum Günü Kutlaması',
                content: 'Mutlu yıllar %ad%! 🎉🎂 Doğum gününüz kutlu olsun. Size özel hediye kodu: %hediye_kodu%',
                category: 'Kişisel',
                is_default: true,
                variables: ['%ad%', '%hediye_kodu%']
            }
        ];

        // Insert default templates
        const templateResponse = await fetch(`${supabaseUrl}/rest/v1/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(defaultTemplates)
        });

        if (!templateResponse.ok) {
            const errorText = await templateResponse.text();
            throw new Error(`Failed to create templates: ${errorText}`);
        }

        // Create initial WhatsApp session records
        const sessionData = [
            {
                user_id: userId,
                session_type: 'web',
                is_connected: false
            },
            {
                user_id: userId,
                session_type: 'business_api',
                is_connected: false
            }
        ];

        const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(sessionData)
        });

        if (!sessionResponse.ok) {
            const errorText = await sessionResponse.text();
            throw new Error(`Failed to create sessions: ${errorText}`);
        }

        // Create user profile if not exists
        const profileData = {
            user_id: userId,
            full_name: userData.email?.split('@')[0] || 'Kullanıcı',
            email: userData.email
        };

        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(profileData)
        });

        // Don't throw error if profile already exists
        const profileResult = profileResponse.ok ? await profileResponse.json() : null;

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Varsayılan veriler başarıyla oluşturuldu',
                templates_created: defaultTemplates.length,
                sessions_created: sessionData.length,
                profile_created: !!profileResult
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Setup default data error:', error);

        const errorResponse = {
            error: {
                code: 'SETUP_DEFAULT_DATA_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});