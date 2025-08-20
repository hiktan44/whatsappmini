CREATE TABLE media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT,
    thumbnail_url TEXT,
    is_compressed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);