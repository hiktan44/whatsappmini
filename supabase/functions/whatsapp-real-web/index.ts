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
        console.log('WhatsApp Real Web function started');

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const whatsappServiceUrl = Deno.env.get('WHATSAPP_SERVICE_URL') || 'https://authentic-whatsapp-service.railway.app';

        if (!serviceRoleKey || !supabaseUrl || !anonKey) {
            console.error('Missing environment variables');
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

        // Enhanced user authentication
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authentication required');
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (token === anonKey) {
            throw new Error('User authentication required - please log in');
        }

        // Verify token with Supabase Auth
        let userId, userEmail;
        try {
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': anonKey
                }
            });

            if (!userResponse.ok) {
                throw new Error('Invalid or expired authentication token');
            }

            const userData = await userResponse.json();
            userId = userData.id;
            userEmail = userData.email;
            
            console.log('User authenticated:', { userId, userEmail });
            
            if (!userId) {
                throw new Error('User ID not found in verified token');
            }
        } catch (e) {
            console.error('Authentication verification failed:', e);
            throw new Error(`Authentication failed: ${e.message}`);
        }

        if (action === 'init_whatsapp_session') {
            console.log('Initializing AUTHENTIC WhatsApp Web session for user:', userId);
            
            try {
                // Call external WhatsApp microservice
                const whatsappResponse = await fetch(`${whatsappServiceUrl}/api/init-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: userId
                    })
                });

                if (!whatsappResponse.ok) {
                    const errorText = await whatsappResponse.text();
                    console.error('WhatsApp service error:', errorText);
                    throw new Error(`WhatsApp service error: ${errorText}`);
                }

                const whatsappData = await whatsappResponse.json();
                console.log('WhatsApp service response:', whatsappData);

                // Get QR code from the service
                const qrResponse = await fetch(`${whatsappServiceUrl}/api/qr-code/${whatsappData.sessionId}`);
                let qrData = null;
                
                if (qrResponse.ok) {
                    qrData = await qrResponse.json();
                }

                // Save session to database
                const checkResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web&select=id`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!checkResponse.ok) {
                    throw new Error('Failed to check existing sessions');
                }

                const existingSessions = await checkResponse.json();
                console.log('Existing sessions found:', existingSessions.length);

                const sessionData = {
                    external_session_id: whatsappData.sessionId,
                    qr_code: qrData?.qrString || null,
                    connection_data: {
                        sessionId: whatsappData.sessionId,
                        serviceUrl: whatsappServiceUrl,
                        status: whatsappData.status || 'initializing',
                        timestamp: new Date().toISOString()
                    },
                    is_connected: false,
                    updated_at: new Date().toISOString()
                };

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
                        body: JSON.stringify(sessionData)
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
                            ...sessionData,
                            created_at: new Date().toISOString()
                        })
                    });
                }

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    console.error('Failed to save session:', errorText);
                    throw new Error(`Failed to save session: ${errorText}`);
                }

                console.log('Authentic WhatsApp session saved successfully');

                return new Response(JSON.stringify({
                    data: {
                        session_id: whatsappData.sessionId,
                        qr_code: qrData?.qrString || null,
                        qr_data_url: qrData?.qrDataUrl || null,
                        expires_at: qrData?.expiresAt || null,
                        status: 'waiting_for_scan',
                        message: 'AUTHENTIC WhatsApp Web session oluşturuldu. GERÇEK QR kodu WhatsApp uygulamanızla tarayın.',
                        instructions: {
                            step1: 'WhatsApp uygulamanızı açın',
                            step2: 'Menü > Bağlı Cihazlar seçeneğine gidin',
                            step3: 'Cihaz Bağla butonuna tıklayın',
                            step4: 'Bu GERÇEK QR kodu kameranızla tarayın'
                        }
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                console.error('WhatsApp service integration error:', error);
                
                // Fallback to mock for demonstration if service is unavailable
                const mockSessionId = `mock_${userId}_${Date.now()}`;
                const mockQrData = `mock-qr-${Date.now()}-${userId}`;
                
                return new Response(JSON.stringify({
                    data: {
                        session_id: mockSessionId,
                        qr_code: mockQrData,
                        status: 'service_unavailable',
                        message: 'WhatsApp servisi şu anda kullanılamıyor. Demo QR kodu gösteriliyor.',
                        note: 'AUTHENTIC SERVICE: Gerçek entegrasyon için external WhatsApp mikroservisi gerekli.'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        if (action === 'check_session_status') {
            console.log('Checking AUTHENTIC WhatsApp session status for user:', userId);
            
            // Get session from database
            const sessionResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web&select=*&order=updated_at.desc&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!sessionResponse.ok) {
                throw new Error('Failed to get session status');
            }

            const sessions = await sessionResponse.json();
            const session = sessions[0];

            if (!session) {
                return new Response(JSON.stringify({
                    data: {
                        status: 'no_session',
                        is_connected: false,
                        message: 'WhatsApp Web session bulunamadı'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // If we have an external session ID, check with the WhatsApp service
            if (session.external_session_id) {
                try {
                    const externalStatusResponse = await fetch(`${whatsappServiceUrl}/api/session-status/${session.external_session_id}`);
                    
                    if (externalStatusResponse.ok) {
                        const externalStatus = await externalStatusResponse.json();
                        console.log('External WhatsApp service status:', externalStatus);
                        
                        // Get fresh QR code if available
                        let qrData = null;
                        if (externalStatus.status === 'waiting_for_scan' || externalStatus.hasQrCode) {
                            const qrResponse = await fetch(`${whatsappServiceUrl}/api/qr-code/${session.external_session_id}`);
                            if (qrResponse.ok) {
                                qrData = await qrResponse.json();
                            }
                        }
                        
                        // Update local session if status changed
                        if (externalStatus.status === 'connected' && !session.is_connected) {
                            await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${serviceRoleKey}`,
                                    'apikey': serviceRoleKey,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    is_connected: true,
                                    last_connected_at: externalStatus.connectedAt || new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                })
                            });
                        }
                        
                        return new Response(JSON.stringify({
                            data: {
                                session_id: session.external_session_id,
                                status: externalStatus.status,
                                is_connected: externalStatus.status === 'connected',
                                last_connected_at: externalStatus.connectedAt,
                                qr_code: qrData?.qrString || null,
                                qr_data_url: qrData?.qrDataUrl || null,
                                expires_at: qrData?.expiresAt || null,
                                message: externalStatus.status === 'connected' ? 'AUTHENTIC WhatsApp Web bağlantısı aktif!' :
                                        externalStatus.status === 'waiting_for_scan' ? 'AUTHENTIC QR kod taranmayı bekliyor' :
                                        'WhatsApp Web durumu: ' + externalStatus.status,
                                service_status: 'external_service_active'
                            }
                        }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                        });
                    }
                } catch (error) {
                    console.error('External WhatsApp service connection error:', error);
                    // Continue with fallback logic below
                }
            }
            
            // Fallback to local session data if external service is unavailable
            const connectionData = session.connection_data;
            const isExpired = connectionData?.expires_at ? new Date(connectionData.expires_at) < new Date() : false;

            let status = 'waiting_for_scan';
            if (session.is_connected) {
                status = 'connected';
            } else if (isExpired) {
                status = 'expired';
            }

            return new Response(JSON.stringify({
                data: {
                    session_id: connectionData?.session_id || session.external_session_id,
                    status: status,
                    is_connected: session.is_connected || false,
                    last_connected_at: session.last_connected_at,
                    qr_code: isExpired ? null : session.qr_code,
                    expires_at: connectionData?.expires_at,
                    message: status === 'connected' ? 'WhatsApp Web bağlantısı aktif (Local)' :
                            status === 'expired' ? 'QR kod süresi doldu, yeniden oluşturun' :
                            'QR kod taranmayı bekliyor (Local)',
                    service_status: 'local_fallback'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'simulate_scan') {
            console.log('Simulating QR code scan for user:', userId);
            
            // This simulates what happens when user scans the QR code
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/whatsapp_sessions?user_id=eq.${userId}&session_type=eq.web`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_connected: true,
                    last_connected_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update connection status');
            }

            return new Response(JSON.stringify({
                data: {
                    status: 'connected',
                    is_connected: true,
                    message: 'WhatsApp Web başarıyla bağlandı!',
                    connected_at: new Date().toISOString()
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'disconnect_session') {
            console.log('Disconnecting WhatsApp session for user:', userId);
            
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
                throw new Error('Failed to disconnect session');
            }

            return new Response(JSON.stringify({
                data: {
                    status: 'disconnected',
                    is_connected: false,
                    message: 'WhatsApp Web bağlantısı kesildi'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Invalid action
        throw new Error(`Invalid action: ${action}`);

    } catch (error) {
        console.error('WhatsApp Real Web error:', error);

        const errorResponse = {
            error: {
                code: 'WHATSAPP_REAL_WEB_ERROR',
                message: error.message,
                details: 'WhatsApp Web entegrasyonu hatası'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});