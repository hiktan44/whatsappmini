CREATE TABLE contact_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    added_at timestamptz DEFAULT now()
);