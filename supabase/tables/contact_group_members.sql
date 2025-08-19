CREATE TABLE contact_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL,
    group_id UUID NOT NULL,
    added_at TIMESTAMP DEFAULT now()
);