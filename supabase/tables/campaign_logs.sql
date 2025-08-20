CREATE TABLE campaign_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending',
    'sent',
    'delivered',
    'failed',
    'read')),
    message_content text,
    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    error_message text,
    created_at timestamptz DEFAULT now()
);