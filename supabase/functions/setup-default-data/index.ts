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
        console.log('Setup default data function started');

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            console.error('Missing environment variables:', { serviceRoleKey: !!serviceRoleKey, supabaseUrl: !!supabaseUrl });
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            console.error('No authorization header provided');
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Token extracted, length:', token.length);

        // Decode JWT token to get user ID and email
        let userId, userEmail;
        try {
            const [, payload] = token.split('.');
            const decodedPayload = JSON.parse(atob(payload));
            userId = decodedPayload.sub;
            userEmail = decodedPayload.email;
            console.log('User data extracted:', { userId, userEmail });
        } catch (e) {
            console.error('Failed to decode JWT token:', e);
            throw new Error('Invalid token format');
        }

        if (!userId) {
            throw new Error('No user ID found in token');
        }

        // Check if user already has default data
        console.log('Checking if user already has templates');
        const templatesCheck = await fetch(`${supabaseUrl}/rest/v1/message_templates?user_id=eq.${userId}&is_default=eq.true&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!templatesCheck.ok) {
            console.error('Failed to check existing templates:', await templatesCheck.text());
            throw new Error('Failed to check existing templates');
        }

        const existingTemplates = await templatesCheck.json();
        console.log('Existing templates found:', existingTemplates.length);

        let templatesCreated = 0;
        if (existingTemplates.length === 0) {
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

            console.log('Creating default templates');
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
                console.error('Failed to create templates:', errorText);
                throw new Error(`Failed to create templates: ${errorText}`);
            }

            const createdTemplates = await templateResponse.json();
            templatesCreated = createdTemplates.length;
            console.log('Templates created successfully:', templatesCreated);
        } else {
            console.log('User already has default templates, skipping');
        }

        // Check if user already has WhatsApp sessions
        console.log('Checking if user already has WhatsApp sessions');
        const sessionsCheck = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!sessionsCheck.ok) {
            console.error('Failed to check existing sessions:', await sessionsCheck.text());
            throw new Error('Failed to check existing sessions');
        }

        const existingSessions = await sessionsCheck.json();
        console.log('Existing sessions found:', existingSessions.length);

        let sessionsCreated = 0;
        if (existingSessions.length === 0) {
            // Create initial WhatsApp session records
            const sessionData = [
                {
                    user_id: userId,
                    session_type: 'web',
                    is_connected: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    user_id: userId,
                    session_type: 'business_api',
                    is_connected: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            console.log('Creating WhatsApp sessions');
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
                console.error('Failed to create sessions:', errorText);
                throw new Error(`Failed to create sessions: ${errorText}`);
            }

            const createdSessions = await sessionResponse.json();
            sessionsCreated = createdSessions.length;
            console.log('Sessions created successfully:', sessionsCreated);
        } else {
            console.log('User already has WhatsApp sessions, skipping');
        }

        // Check if user profile exists
        console.log('Checking if user profile exists');
        const profileCheck = await fetch(`${supabaseUrl}/rest/v1/profiles?user_id=eq.${userId}&select=id`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!profileCheck.ok) {
            console.error('Failed to check existing profile:', await profileCheck.text());
            throw new Error('Failed to check existing profile');
        }

        const existingProfiles = await profileCheck.json();
        console.log('Existing profiles found:', existingProfiles.length);

        let profileCreated = false;
        if (existingProfiles.length === 0) {
            // Create user profile
            const profileData = {
                user_id: userId,
                full_name: userEmail?.split('@')[0] || 'Kullanıcı',
                email: userEmail,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('Creating user profile');
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

            if (profileResponse.ok) {
                profileCreated = true;
                console.log('Profile created successfully');
            } else {
                console.error('Failed to create profile:', await profileResponse.text());
                // Don't throw error if profile creation fails - it's not critical
            }
        } else {
            console.log('User already has profile, skipping');
        }

        console.log('Setup default data completed successfully');

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Varsayılan veriler başarıyla oluşturuldu',
                templates_created: templatesCreated,
                sessions_created: sessionsCreated,
                profile_created: profileCreated
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