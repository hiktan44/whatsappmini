CREATE TABLE contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    phone_number text NOT NULL,
    email text,
    notes text,
    tags text[] DEFAULT '{}',
    avatar_url text,
    last_contacted_at timestamptz,
    is_favorite boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);