CREATE TABLE contact_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    group_name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id,
    group_name)
);