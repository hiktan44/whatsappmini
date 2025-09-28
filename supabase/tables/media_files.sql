CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);