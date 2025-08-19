CREATE TABLE custom_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    variable_name VARCHAR(255) NOT NULL,
    variable_value TEXT NOT NULL,
    description TEXT,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);