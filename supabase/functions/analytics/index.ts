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
        const { userId, timeframe = '30d' } = await req.json();

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        // Get campaigns analytics
        const campaignsResponse = await fetch(`${supabaseUrl}/rest/v1/campaigns?user_id=eq.${userId}&created_at=gte.${startDate.toISOString()}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!campaignsResponse.ok) {
            throw new Error('Failed to fetch campaigns');
        }

        const campaigns = await campaignsResponse.json();

        // Get message logs analytics
        const logsResponse = await fetch(`${supabaseUrl}/rest/v1/campaign_logs?created_at=gte.${startDate.toISOString()}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!logsResponse.ok) {
            throw new Error('Failed to fetch message logs');
        }

        const logs = await logsResponse.json();

        // Get contacts count
        const contactsResponse = await fetch(`${supabaseUrl}/rest/v1/contacts?user_id=eq.${userId}&is_active=eq.true`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const contacts = contactsResponse.ok ? await contactsResponse.json() : [];

        // Get templates count
        const templatesResponse = await fetch(`${supabaseUrl}/rest/v1/templates?user_id=eq.${userId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        const templates = templatesResponse.ok ? await templatesResponse.json() : [];

        // Calculate analytics
        const totalCampaigns = campaigns.length;
        const totalMessages = logs.length;
        const sentMessages = logs.filter(log => log.status === 'sent').length;
        const failedMessages = logs.filter(log => log.status === 'failed').length;
        const successRate = totalMessages > 0 ? (sentMessages / totalMessages * 100).toFixed(2) : 0;

        // Group campaigns by status
        const campaignsByStatus = campaigns.reduce((acc, campaign) => {
            acc[campaign.status] = (acc[campaign.status] || 0) + 1;
            return acc;
        }, {});

        // Group messages by date for chart data
        const messagesByDate = logs.reduce((acc, log) => {
            const date = new Date(log.created_at).toLocaleDateString('en-CA');
            if (!acc[date]) {
                acc[date] = { sent: 0, failed: 0 };
            }
            acc[date][log.status]++;
            return acc;
        }, {});

        // Convert to chart format
        const chartData = Object.entries(messagesByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({
                date,
                sent: data.sent || 0,
                failed: data.failed || 0
            }));

        return new Response(JSON.stringify({
            data: {
                overview: {
                    totalCampaigns,
                    totalMessages,
                    sentMessages,
                    failedMessages,
                    successRate: parseFloat(successRate),
                    totalContacts: contacts.length,
                    totalTemplates: templates.length
                },
                campaignsByStatus,
                chartData,
                timeframe
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'ANALYTICS_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
