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
        const { contacts_data, import_type } = await req.json();

        if (!contacts_data || !Array.isArray(contacts_data)) {
            throw new Error('Valid contacts data array is required');
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

        const processedContacts = [];
        const errors = [];

        // Process contacts based on import type
        for (let i = 0; i < contacts_data.length; i++) {
            const contact = contacts_data[i];

            try {
                let contactData;

                if (import_type === 'whatsapp') {
                    // WhatsApp contacts.json format
                    contactData = {
                        user_id: userId,
                        name: contact.name || contact.displayName || 'Bilinmeyen',
                        phone: contact.phone || contact.number || '',
                        email: contact.email || null,
                        group_name: contact.group || 'WhatsApp',
                        notes: contact.status || null
                    };
                } else if (import_type === 'excel') {
                    // Excel format
                    contactData = {
                        user_id: userId,
                        name: contact.name || contact.ad || contact.isim || 'Bilinmeyen',
                        phone: contact.phone || contact.telefon || contact.number || '',
                        email: contact.email || contact.eposta || null,
                        group_name: contact.group || contact.grup || 'Excel',
                        notes: contact.notes || contact.notlar || contact.aciklama || null
                    };
                } else {
                    // Generic format
                    contactData = {
                        user_id: userId,
                        name: contact.name || 'Bilinmeyen',
                        phone: contact.phone || '',
                        email: contact.email || null,
                        group_name: contact.group || 'Genel',
                        notes: contact.notes || null
                    };
                }

                // Validate required fields
                if (!contactData.name || !contactData.phone) {
                    errors.push(`Satır ${i + 1}: İsim ve telefon numarası gereklidir`);
                    continue;
                }

                // Clean phone number
                contactData.phone = contactData.phone.replace(/[^0-9+]/g, '');

                if (contactData.phone.length < 10) {
                    errors.push(`Satır ${i + 1}: Geçersiz telefon numarası`);
                    continue;
                }

                processedContacts.push(contactData);

            } catch (contactError) {
                errors.push(`Satır ${i + 1}: ${contactError.message}`);
            }
        }

        if (processedContacts.length === 0) {
            throw new Error('İçe aktarılacak geçerli kişi bulunamadı');
        }

        // Batch insert contacts
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/contacts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(processedContacts)
        });

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Database insert failed: ${errorText}`);
        }

        const insertedContacts = await insertResponse.json();

        return new Response(JSON.stringify({
            data: {
                success: true,
                imported_count: insertedContacts.length,
                error_count: errors.length,
                errors: errors,
                message: `${insertedContacts.length} kişi başarıyla içe aktarıldı`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Import contacts error:', error);

        const errorResponse = {
            error: {
                code: 'IMPORT_CONTACTS_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});