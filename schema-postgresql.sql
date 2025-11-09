-- ================================================================
-- THE WAY - PostgreSQL Schema (Web Backend)
-- For Next.js API + Web Client
-- ================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ================================================================
-- SECTION 1: AUTHENTICATION & USERS
-- ================================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('user', 'pastor', 'admin');

-- Users table (compatible with NextAuth)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- Compatible with NextAuth (Clerk ID or NextAuth ID)
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    email_verified TIMESTAMPTZ,
    name VARCHAR(255),
    image TEXT, -- Avatar URL
    user_role user_role NOT NULL DEFAULT 'user',
    bio TEXT,
    current_reading_location VARCHAR(50), -- e.g., "John 3:16"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NextAuth accounts table (for OAuth providers)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_account_id)
);

-- NextAuth sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NextAuth verification tokens
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- ================================================================
-- SECTION 2: BIBLE DATA (from scrollmapper)
-- ================================================================

-- Bible translations metadata
CREATE TABLE bible_translations (
    translation VARCHAR(20) PRIMARY KEY, -- e.g., 'KJV', 'KJVA'
    title VARCHAR(255) NOT NULL,
    language VARCHAR(10),
    license TEXT,
    has_strongs BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bible books (shared across translations)
CREATE TABLE bible_books (
    id SERIAL PRIMARY KEY,
    book_number INTEGER UNIQUE NOT NULL, -- 1-66 (or 1-80 with Apocrypha)
    name VARCHAR(50) NOT NULL,
    testament VARCHAR(2) NOT NULL CHECK (testament IN ('OT', 'NT')),
    chapters INTEGER NOT NULL,
    UNIQUE(book_number)
);

-- Bible verses (KJV - can add more translations later)
CREATE TABLE bible_verses (
    id SERIAL PRIMARY KEY,
    translation VARCHAR(20) NOT NULL DEFAULT 'KJV' REFERENCES bible_translations(translation),
    book_id INTEGER NOT NULL REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    -- Optional: Store Strong's numbers if available
    strongs_data JSONB, -- e.g., {"words": [{"text": "love", "strongs": "G26"}]}
    UNIQUE(translation, book_id, chapter, verse)
);

-- Cross-references (from openbible.info via scrollmapper)
CREATE TABLE bible_cross_references (
    id SERIAL PRIMARY KEY,
    from_book INTEGER NOT NULL REFERENCES bible_books(id),
    from_chapter INTEGER NOT NULL,
    from_verse INTEGER NOT NULL,
    to_book INTEGER NOT NULL REFERENCES bible_books(id),
    to_chapter INTEGER NOT NULL,
    to_verse_start INTEGER NOT NULL,
    to_verse_end INTEGER, -- NULL if single verse
    votes INTEGER DEFAULT 0, -- Relevance score from openbible.info
    UNIQUE(from_book, from_chapter, from_verse, to_book, to_chapter, to_verse_start)
);

-- Strong's concordance definitions
CREATE TABLE strongs_definitions (
    strongs_number VARCHAR(10) PRIMARY KEY, -- e.g., 'G26', 'H430'
    testament VARCHAR(2) NOT NULL CHECK (testament IN ('OT', 'NT')),
    original_word VARCHAR(100), -- Greek/Hebrew word
    transliteration VARCHAR(100),
    pronunciation VARCHAR(100),
    part_of_speech VARCHAR(50),
    definition TEXT NOT NULL,
    kjv_usage TEXT -- How KJV translated it
);

-- Word-to-Strong's mapping (for clickable word tool)
-- This is a pre-computed table for fast lookups
CREATE TABLE word_strongs_mapping (
    id SERIAL PRIMARY KEY,
    translation VARCHAR(20) NOT NULL DEFAULT 'KJV' REFERENCES bible_translations(translation),
    book_id INTEGER NOT NULL REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    word_position INTEGER NOT NULL, -- Position in verse
    english_word VARCHAR(100) NOT NULL,
    strongs_number VARCHAR(10) NOT NULL REFERENCES strongs_definitions(strongs_number),
    UNIQUE(translation, book_id, chapter, verse, word_position)
);

-- ================================================================
-- SECTION 3: SOCIAL MEDIA FEATURES
-- ================================================================

-- Posts (social feed)
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    author_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    bible_reference VARCHAR(50), -- e.g., "John 3:16"
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    shares_count INTEGER NOT NULL DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    flagged_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- For threaded replies
    likes_count INTEGER NOT NULL DEFAULT 0,
    is_flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Likes (for posts and comments)
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id)
);

-- Shares (reposting)
CREATE TABLE shares (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    comment TEXT, -- Optional comment when sharing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Follows (user following)
CREATE TABLE follows (
    id SERIAL PRIMARY KEY,
    follower_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

-- ================================================================
-- SECTION 4: CHURCH LINK (Groups & Administration)
-- ================================================================

-- Church groups
CREATE TABLE church_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    church_name VARCHAR(255), -- Physical church name
    location VARCHAR(255),
    image_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Church group membership
CREATE TABLE church_members (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL REFERENCES church_groups(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader', 'admin', 'pastor')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(church_id, user_id)
);

-- Prayer requests
CREATE TABLE prayers (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES church_groups(id) ON DELETE CASCADE,
    author_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_answered BOOLEAN DEFAULT false,
    prayer_count INTEGER NOT NULL DEFAULT 0, -- How many people prayed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prayer tracking (who prayed for what)
CREATE TABLE prayer_tracking (
    id SERIAL PRIMARY KEY,
    prayer_id INTEGER NOT NULL REFERENCES prayers(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prayed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(prayer_id, user_id)
);

-- Sermons
CREATE TABLE sermons (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES church_groups(id) ON DELETE CASCADE,
    pastor_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sermon_date DATE NOT NULL,
    bible_passages TEXT, -- e.g., "John 3:16-21, Romans 5:8"
    video_url TEXT,
    audio_url TEXT,
    notes_url TEXT,
    views_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Polls (for church leaders)
CREATE TABLE polls (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL REFERENCES church_groups(id) ON DELETE CASCADE,
    created_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    closes_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Poll options
CREATE TABLE poll_options (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text VARCHAR(255) NOT NULL,
    votes_count INTEGER NOT NULL DEFAULT 0
);

-- Poll votes
CREATE TABLE poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id INTEGER NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- ================================================================
-- SECTION 5: BIBLE STUDY TOOLS
-- ================================================================

-- Reading plans
CREATE TABLE reading_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    created_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reading plan schedule
CREATE TABLE reading_plan_schedule (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    book_id INTEGER NOT NULL REFERENCES bible_books(id),
    chapter_start INTEGER NOT NULL,
    chapter_end INTEGER NOT NULL,
    UNIQUE(plan_id, day_number)
);

-- User reading progress
CREATE TABLE reading_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
    current_day INTEGER NOT NULL DEFAULT 1,
    completed_days INTEGER[] DEFAULT '{}', -- Array of completed day numbers
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    UNIQUE(user_id, plan_id)
);

-- Memory verses
CREATE TABLE memory_verses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
    last_practiced TIMESTAMPTZ,
    times_practiced INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, book_id, chapter, verse)
);

-- Bible study lessons (created by pastors)
CREATE TABLE study_lessons (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES church_groups(id) ON DELETE CASCADE,
    created_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Structured lesson content (text, images, videos, quizzes)
    bible_references TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Study games (trivia, attack & defend)
CREATE TABLE study_games (
    id SERIAL PRIMARY KEY,
    church_id INTEGER REFERENCES church_groups(id) ON DELETE CASCADE,
    created_by VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('trivia', 'attack_defend')),
    config JSONB NOT NULL, -- Game configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game leaderboard
CREATE TABLE game_scores (
    id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES study_games(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- SECTION 6: NOTIFICATIONS & MODERATION
-- ================================================================

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., 'like', 'comment', 'follow', 'prayer', 'sermon'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    link TEXT, -- Deep link to relevant content
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content reports (flagging)
CREATE TABLE content_reports (
    id SERIAL PRIMARY KEY,
    reporter_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    reviewed_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(user_role);

-- Bible verses (CRITICAL for performance)
CREATE INDEX idx_bible_verses_lookup ON bible_verses(translation, book_id, chapter, verse);
CREATE INDEX idx_bible_verses_book ON bible_verses(book_id);
CREATE INDEX idx_bible_verses_text_search ON bible_verses USING gin(to_tsvector('english', text));

-- Cross references
CREATE INDEX idx_cross_ref_from ON bible_cross_references(from_book, from_chapter, from_verse);
CREATE INDEX idx_cross_ref_to ON bible_cross_references(to_book, to_chapter, to_verse_start);

-- Word mappings (for clickable word tool)
CREATE INDEX idx_word_mapping_lookup ON word_strongs_mapping(translation, book_id, chapter, verse, word_position);
CREATE INDEX idx_word_mapping_word ON word_strongs_mapping(english_word);

-- Posts
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_bible_ref ON posts(bible_reference);

-- Comments
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- Church groups
CREATE INDEX idx_church_members_church ON church_members(church_id);
CREATE INDEX idx_church_members_user ON church_members(user_id);

-- Prayers
CREATE INDEX idx_prayers_church ON prayers(church_id);
CREATE INDEX idx_prayers_author ON prayers(author_id);
CREATE INDEX idx_prayers_created ON prayers(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ================================================================
-- TRIGGERS (Auto-update timestamps, counters)
-- ================================================================

-- Update updated_at on record change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment post likes counter
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_counter AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION increment_post_likes();

-- ================================================================
-- INITIAL DATA (Insert basic data)
-- ================================================================

-- Insert sample translation
INSERT INTO bible_translations (translation, title, language, has_strongs) VALUES
('KJV', 'King James Version (1769)', 'en', true);

-- Insert Bible books (abbreviated - you'll populate from scrollmapper data)
INSERT INTO bible_books (book_number, name, testament, chapters) VALUES
(1, 'Genesis', 'OT', 50),
(2, 'Exodus', 'OT', 40),
(3, 'Leviticus', 'OT', 27),
(4, 'Numbers', 'OT', 36),
(5, 'Deuteronomy', 'OT', 34),
-- ... (continue for all 66 books)
(40, 'Matthew', 'NT', 28),
(41, 'Mark', 'NT', 16),
(42, 'Luke', 'NT', 24),
(43, 'John', 'NT', 21);
-- ... (continue for all NT books)

-- ================================================================
-- COMMENTS
-- ================================================================
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE bible_verses IS 'Bible text from scrollmapper database';
COMMENT ON TABLE word_strongs_mapping IS 'Pre-computed word to Strongs mappings for clickable word tool';
COMMENT ON TABLE posts IS 'Social media posts with optional Bible references';
COMMENT ON TABLE church_groups IS 'Church communities for Church Link feature';
