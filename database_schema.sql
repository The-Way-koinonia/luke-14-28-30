-- File: database_schema.sql

-- 1. USERS Table (The Core)
-- This table stores user profile data and the crucial 'role' for Church Link governance.
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    user_role VARCHAR(20) NOT NULL DEFAULT 'user', -- e.g., 'user', 'pastor', 'admin'
    current_reading_location VARCHAR(255), -- For the 'Display current bible locations' feature
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. POSTS Table (The Social Feed)
-- This stores the user-generated content and links it back to the author.
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    author_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    bible_reference VARCHAR(50), -- To store the explicit verse links
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Foreign Key Constraint linking post to user
    FOREIGN KEY (author_id) REFERENCES users (user_id)
);

-- 3. INDEXES
-- Indexes are essential for performance on large tables (like the social feed).
CREATE INDEX idx_posts_author ON posts (author_id);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

-- Future Tables to Add:
-- - church_groups (for the Church Link feature)
-- - comments (linked to posts and users)
-- - word_definitions (for the Clickable Word Tool)
-- - verse_usages (for the complex relational links)
