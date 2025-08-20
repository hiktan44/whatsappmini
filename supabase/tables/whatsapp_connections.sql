CREATE TABLE whatsapp_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    connection_type text NOT NULL CHECK (connection_type IN ('web',
    'api')),
    connection_status text DEFAULT 'disconnected' CHECK (connection_status IN ('connected',
    'disconnected',
    'connecting',
    'error')),
    qr_code_data text,
    qr_code_image text,
    session_data jsonb,
    api_credentials jsonb,
    last_connected_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);