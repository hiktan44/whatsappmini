CREATE TABLE message_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    recipient_phone text NOT NULL,
    recipient_name text,
    message_content text NOT NULL,
    template_id uuid,
    media_files jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'sent',
    delivery_status text DEFAULT 'pending',
    error_message text,
    sent_at timestamptz DEFAULT now()
);