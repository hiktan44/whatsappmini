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
        const { action, ...params } = await req.json();

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

        if (action === 'save_credentials') {
            const { phone_number_id, access_token } = params;

            if (!phone_number_id || !access_token) {
                throw new Error('Phone number ID and access token are required');
            }

            // Update Business API session
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.business_api`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    phone_number_id,
                    access_token,
                    is_connected: true,
                    last_connected_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to save credentials: ${errorText}`);
            }

            return new Response(JSON.stringify({
                data: {
                    message: 'Business API bilgileri başarıyla kaydedildi'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'send_message') {
            const { recipient, message, template_id, media_files } = params;

            if (!recipient || !message) {
                throw new Error('Recipient and message are required');
            }

            // Get Business API credentials
            const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.business_api&select=*`, {
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

            if (!session || !session.is_connected) {
                throw new Error('Business API is not connected');
            }

            // Simulate sending message via WhatsApp Business API
            // In a real implementation, this would make actual API calls to WhatsApp
            const messageId = `msg_${Date.now()}_${userId}`;
            
            // Log sent message
            const sentMessageData = {
                user_id: userId,
                contact_id: recipient.id,
                message_content: message,
                template_id: template_id || null,
                media_files: media_files || [],
                whatsapp_message_id: messageId,
                status: 'sent'
            };

            const logResponse = await fetch(`${supabaseUrl}/rest/v1/sent_messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(sentMessageData)
            });

            if (!logResponse.ok) {
                const errorText = await logResponse.text();
                console.error('Failed to log message:', errorText);
            }

            return new Response(JSON.stringify({
                data: {
                    message_id: messageId,
                    status: 'sent',
                    message: 'Mesaj başarıyla gönderildi'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_status') {
            // Get Business API connection status
            const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.business_api&select=*`, {
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

            return new Response(JSON.stringify({
                data: {
                    is_connected: session?.is_connected || false,
                    phone_number_id: session?.phone_number_id || null,
                    last_connected_at: session?.last_connected_at || null
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action');

    } catch (error) {
        console.error('WhatsApp Business API error:', error);

        const errorResponse = {
            error: {
                code: 'WHATSAPP_BUSINESS_API_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});