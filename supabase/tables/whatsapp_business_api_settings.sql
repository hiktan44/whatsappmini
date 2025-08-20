CREATE TABLE whatsapp_business_api_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    api_key text,
    phone_number_id text,
    access_token text,
    is_active boolean DEFAULT false,
    webhook_url text,
    verify_token text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);