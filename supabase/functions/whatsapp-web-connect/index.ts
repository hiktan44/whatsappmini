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
        const { action } = await req.json();

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

        if (action === 'generate_qr') {
            // Simulate QR code generation for WhatsApp Web
            // In a real implementation, this would integrate with WhatsApp Web API
            const qrData = {
                qr_code: `whatsapp_web_${userId}_${Date.now()}`,
                expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute expiry
                session_id: `session_${userId}_${Date.now()}`
            };

            // Update WhatsApp session with QR code data
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    qr_code: qrData.qr_code,
                    connection_data: qrData,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update session: ${errorText}`);
            }

            return new Response(JSON.stringify({
                data: {
                    qr_code: qrData.qr_code,
                    expires_at: qrData.expires_at,
                    message: 'QR kod oluşturuldu. Lütfen WhatsApp uygulamanızdan tarayın.'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'check_connection') {
            // Check connection status
            const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!sessionResponse.ok) {
                throw new Error('Failed to get session data');
            }

            const sessions = await sessionResponse.json();
            const session = sessions[0];

            if (!session) {
                throw new Error('Session not found');
            }

            return new Response(JSON.stringify({
                data: {
                    is_connected: session.is_connected,
                    last_connected_at: session.last_connected_at,
                    qr_code: session.qr_code
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'disconnect') {
            // Disconnect WhatsApp Web session
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_connected: false,
                    qr_code: null,
                    connection_data: null,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to disconnect: ${errorText}`);
            }

            return new Response(JSON.stringify({
                data: {
                    message: 'WhatsApp Web bağlantısı kesildi'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action');

    } catch (error) {
        console.error('WhatsApp Web connection error:', error);

        const errorResponse = {
            error: {
                code: 'WHATSAPP_WEB_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});