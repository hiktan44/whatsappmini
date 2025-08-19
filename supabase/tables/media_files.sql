CREATE TABLE media_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    filename text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);