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
        const { campaignId, userId } = await req.json();

        if (!campaignId || !userId) {
            throw new Error('Campaign ID and User ID are required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get campaign details
        const campaignResponse = await fetch(`${supabaseUrl}/rest/v1/campaigns?id=eq.${campaignId}&user_id=eq.${userId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!campaignResponse.ok) {
            throw new Error('Failed to fetch campaign');
        }

        const campaigns = await campaignResponse.json();
        if (campaigns.length === 0) {
            throw new Error('Campaign not found');
        }

        const campaign = campaigns[0];

        // Get template if specified
        let messageTemplate = '';
        if (campaign.template_id) {
            const templateResponse = await fetch(`${supabaseUrl}/rest/v1/templates?id=eq.${campaign.template_id}&user_id=eq.${userId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (templateResponse.ok) {
                const templates = await templateResponse.json();
                if (templates.length > 0) {
                    messageTemplate = templates[0].content;
                }
            }
        }

        // Get user's contacts
        const contactsResponse = await fetch(`${supabaseUrl}/rest/v1/contacts?user_id=eq.${userId}&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!contactsResponse.ok) {
            throw new Error('Failed to fetch contacts');
        }

        const contacts = await contactsResponse.json();
        
        if (contacts.length === 0) {
            throw new Error('No active contacts found');
        }

        // Update campaign status to 'running'
        await fetch(`${supabaseUrl}/rest/v1/campaigns?id=eq.${campaignId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'running',
                total_contacts: contacts.length,
                updated_at: new Date().toISOString()
            })
        });

        let successCount = 0;
        let failureCount = 0;

        // Process each contact
        for (const contact of contacts) {
            try {
                // Replace variables in message
                let personalizedMessage = messageTemplate;
                if (contact.name) {
                    personalizedMessage = personalizedMessage
                        .replace(/%name%/g, contact.name)
                        .replace(/%NAME%/g, contact.name)
                        .replace(/%ad%/g, contact.name.split(' ')[0])
                        .replace(/%fullname%/g, contact.name);
                }

                // Replace date variables
                const now = new Date();
                personalizedMessage = personalizedMessage
                    .replace(/%tarih%/g, now.toLocaleDateString('tr-TR'))
                    .replace(/%gun%/g, now.getDate().toString())
                    .replace(/%ay%/g, (now.getMonth() + 1).toString())
                    .replace(/%yil%/g, now.getFullYear().toString());

                // Replace greeting variables
                personalizedMessage = personalizedMessage
                    .replace(/%sayın%/g, 'Sayın')
                    .replace(/%değerli%/g, 'Değerli')
                    .replace(/%kıymetli%/g, 'Kıymetli')
                    .replace(/%sevgili%/g, 'Sevgili');

                // Send message via WhatsApp function
                const sendResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        phoneNumber: contact.phone,
                        message: personalizedMessage,
                        userId: userId,
                        campaignId: campaignId
                    })
                });

                if (sendResponse.ok) {
                    successCount++;
                } else {
                    failureCount++;
                }

                // Small delay between messages to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Failed to send to ${contact.phone}:`, error);
                failureCount++;
            }
        }

        // Update campaign final status
        await fetch(`${supabaseUrl}/rest/v1/campaigns?id=eq.${campaignId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed',
                sent_count: successCount,
                failed_count: failureCount,
                updated_at: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                campaignId: campaignId,
                totalContacts: contacts.length,
                successCount: successCount,
                failureCount: failureCount,
                status: 'completed'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Bulk send error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'BULK_SEND_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
