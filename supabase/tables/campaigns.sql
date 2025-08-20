CREATE TABLE campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    template_id uuid,
    contact_groups uuid[],
    scheduled_at timestamptz,
    status text DEFAULT 'draft' CHECK (status IN ('draft',
    'scheduled',
    'sending',
    'completed',
    'failed')),
    total_contacts integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);