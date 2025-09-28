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
        console.log('WhatsApp Web Connect function started');

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            console.error('Missing environment variables:', { serviceRoleKey: !!serviceRoleKey, supabaseUrl: !!supabaseUrl });
            throw new Error('Supabase configuration missing');
        }

        // Parse request body
        let requestData;
        try {
            requestData = await req.json();
        } catch (e) {
            console.error('Failed to parse request body:', e);
            throw new Error('Invalid JSON in request body');
        }

        const { action } = requestData;
        console.log('Action requested:', action);

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            console.error('No authorization header provided');
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Token extracted, length:', token.length);

        // Decode JWT token to get user ID
        let userId;
        try {
            const [, payload] = token.split('.');
            const decodedPayload = JSON.parse(atob(payload));
            userId = decodedPayload.sub;
            console.log('User ID extracted:', userId);
        } catch (e) {
            console.error('Failed to decode JWT token:', e);
            throw new Error('Invalid token format');
        }

        if (!userId) {
            throw new Error('No user ID found in token');
        }

        if (action === 'generate_qr') {
            console.log('Generating QR code for user:', userId);
            
            // Generate QR code data
            const qrData = {
                qr_code: `whatsapp_web_${userId}_${Date.now()}`,
                expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute expiry
                session_id: `session_${userId}_${Date.now()}`
            };

            console.log('QR data generated:', qrData);

            // First, check if session exists
            const checkResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web&select=id`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!checkResponse.ok) {
                console.error('Failed to check session:', await checkResponse.text());
                throw new Error('Failed to check session');
            }

            const existingSessions = await checkResponse.json();
            console.log('Existing sessions found:', existingSessions.length);

            let updateResponse;
            if (existingSessions.length > 0) {
                // Update existing session
                updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web`, {
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
            } else {
                // Create new session
                updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        session_type: 'web',
                        qr_code: qrData.qr_code,
                        connection_data: qrData,
                        is_connected: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
            }

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('Failed to update/create session:', errorText);
                throw new Error(`Failed to save session: ${errorText}`);
            }

            console.log('Session updated/created successfully');

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
            console.log('Checking connection status for user:', userId);
            
            // Check connection status
            const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web&select=*`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!sessionResponse.ok) {
                console.error('Failed to get session data:', await sessionResponse.text());
                throw new Error('Failed to get session data');
            }

            const sessions = await sessionResponse.json();
            const session = sessions[0];

            if (!session) {
                console.log('No session found, returning default state');
                return new Response(JSON.stringify({
                    data: {
                        is_connected: false,
                        last_connected_at: null,
                        qr_code: null
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            console.log('Session found:', !!session);

            return new Response(JSON.stringify({
                data: {
                    is_connected: session.is_connected || false,
                    last_connected_at: session.last_connected_at,
                    qr_code: session.qr_code
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'disconnect') {
            console.log('Disconnecting WhatsApp Web for user:', userId);
            
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
                console.error('Failed to disconnect:', errorText);
                throw new Error(`Failed to disconnect: ${errorText}`);
            }

            console.log('Disconnected successfully');

            return new Response(JSON.stringify({
                data: {
                    message: 'WhatsApp Web bağlantısı kesildi'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action: ' + action);

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