CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Özel',
    is_default BOOLEAN DEFAULT FALSE,
    variables TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);