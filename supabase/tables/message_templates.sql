CREATE TABLE message_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    variables text[] DEFAULT '{}',
    category text DEFAULT 'general',
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);