-- Migration to add username column and migrate data from name column

-- Add username column
ALTER TABLE users ADD COLUMN username VARCHAR(255);

-- Copy data from name to username
UPDATE users SET username = name WHERE username IS NULL;

-- Make username NOT NULL and UNIQUE after data migration
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Add stats columns that are expected by the model
ALTER TABLE users ADD COLUMN total_queries INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_verifications INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN correct_verifications INTEGER DEFAULT 0;

-- Drop the old name column (optional - can keep for backward compatibility)
-- ALTER TABLE users DROP COLUMN name;

-- If you want to keep both columns, you can comment out the DROP statement above