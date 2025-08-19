CREATE TABLE whatsapp_business_api_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    api_key text,
    phone_number_id text,
    access_token text,
    webhook_verify_token text,
    business_account_id text,
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);