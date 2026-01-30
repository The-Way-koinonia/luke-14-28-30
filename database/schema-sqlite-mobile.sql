-- ================================================================
-- THE WAY - SQLite Schema (Mobile App - React Native)
-- Embedded database that ships with the mobile app (~15-20MB)
-- 
-- PURPOSE: BIBLE STUDY TOOLS ONLY (Offline-first)
-- SOCIAL FEATURES: Use API calls (online-only like Instagram)
-- ================================================================

-- ================================================================
-- SECTION 1: BIBLE DATA (Read-only, ships with app)
-- ================================================================

-- Bible translations metadata
CREATE TABLE bible_translations (
    translation TEXT PRIMARY KEY,  -- 'KJV'
    title TEXT NOT NULL,
    language TEXT,
    license TEXT,
    has_strongs INTEGER DEFAULT 0  -- SQLite uses 0/1 for boolean
);

-- Bible books (66 books)
CREATE TABLE bible_books (
    id INTEGER PRIMARY KEY,
    book_number INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
    chapters INTEGER NOT NULL
);

-- Bible verses (Main content - ~31,102 verses for KJV)
-- This is the CORE of the mobile app - everything else builds on this
CREATE TABLE bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    translation TEXT NOT NULL DEFAULT 'KJV',
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (translation) REFERENCES bible_translations(translation),
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    UNIQUE(translation, book_id, chapter, verse)
);

-- Cross-references (31,000+ references from openbible.info)
-- Powers the "See Related Verses" feature
CREATE TABLE bible_cross_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_book INTEGER NOT NULL,
    from_chapter INTEGER NOT NULL,
    from_verse INTEGER NOT NULL,
    to_book INTEGER NOT NULL,
    to_chapter INTEGER NOT NULL,
    to_verse_start INTEGER NOT NULL,
    to_verse_end INTEGER,  -- NULL if single verse
    votes INTEGER DEFAULT 0,  -- Relevance score
    FOREIGN KEY (from_book) REFERENCES bible_books(id),
    FOREIGN KEY (to_book) REFERENCES bible_books(id),
    UNIQUE(from_book, from_chapter, from_verse, to_book, to_chapter, to_verse_start)
);

-- Strong's concordance definitions (~8,674 Greek + ~5,624 Hebrew = ~14,298 entries)
-- Powers the "Clickable Word Tool" definitions
CREATE TABLE strongs_definitions (
    strongs_number TEXT PRIMARY KEY,  -- 'G26' (agape), 'H430' (Elohim)
    testament TEXT NOT NULL CHECK (testament IN ('OT', 'NT')),
    original_word TEXT,  -- ἀγάπη, אֱלֹהִים
    transliteration TEXT,  -- 'agape', 'Elohim'
    pronunciation TEXT,  -- 'ag-ah'-pay', 'el-o-heem'
    part_of_speech TEXT,  -- 'noun', 'verb', etc.
    definition TEXT NOT NULL,
    kjv_usage TEXT  -- How KJV translated this word
);

-- Word-to-Strong's mapping (Pre-computed for INSTANT lookups)
-- This is the KEY table for the "Clickable Word Tool"
-- Allows users to tap any word and instantly see its definition
CREATE TABLE word_strongs_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    translation TEXT NOT NULL DEFAULT 'KJV',
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    word_position INTEGER NOT NULL,  -- Position in verse (0-indexed)
    english_word TEXT NOT NULL,  -- Lowercased, punctuation removed
    strongs_number TEXT NOT NULL,
    FOREIGN KEY (translation) REFERENCES bible_translations(translation),
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    FOREIGN KEY (strongs_number) REFERENCES strongs_definitions(strongs_number),
    UNIQUE(translation, book_id, chapter, verse, word_position)
);

-- ================================================================
-- SECTION 2: USER PERSONAL STUDY DATA (Local-first, sync to API)
-- ================================================================

-- User highlights (yellow, green, blue, pink highlighting)
-- Local-first: Works offline, syncs when online
-- User highlights (yellow, green, blue, pink highlighting)
-- Local-first: Works offline, syncs when online
-- UPDATED: Supports multiple highlights per verse (different colors)
CREATE TABLE user_highlights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    color TEXT NOT NULL CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'orange', 'purple')),
    note TEXT,  -- Optional note attached to this specific highlight
    
    -- Sync & Conflict Resolution columns
    created_at TEXT NOT NULL,  -- ISO 8601: "2025-01-15T10:30:00Z"
    updated_at TEXT NOT NULL,
    synced_at TEXT,  -- NULL = not yet synced to server
    server_id INTEGER,  -- Server-side ID after sync
    version INTEGER DEFAULT 1, -- Conflict resolution
    last_modified_device TEXT, -- Debugging/Info
    
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    
    -- NEW CONSTRAINT: User can have multiple highlights per verse,
    -- but only one of each color per verse (prevents accidental duplicates)
    UNIQUE(user_id, book_id, chapter, verse, color)
);

-- User bookmarks (save verses for quick access)
-- User bookmarks (save verses for quick access)
CREATE TABLE user_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    title TEXT,  -- User-defined title like "Comfort verse"
    created_at TEXT NOT NULL,
    synced_at TEXT,
    server_id INTEGER,
    -- Conflict resolution
    updated_at TEXT DEFAULT (datetime('now')), -- Added for consistency
    version INTEGER DEFAULT 1,
    last_modified_device TEXT,
    
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    UNIQUE(user_id, book_id, chapter, verse)
);

-- Memory verses (for memorization tracking)
-- Includes spaced repetition data
-- Memory verses (for memorization tracking)
-- Includes spaced repetition data
CREATE TABLE user_memory_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
    -- 0 = just added, 5 = fully memorized
    last_practiced TEXT,  -- ISO 8601
    next_review_date TEXT,  -- Spaced repetition: when to review next
    times_practiced INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    added_at TEXT NOT NULL,
    synced_at TEXT,
    server_id INTEGER,
    -- Conflict resolution
    updated_at TEXT DEFAULT (datetime('now')), -- Added for consistency
    version INTEGER DEFAULT 1,
    last_modified_device TEXT,
    
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    UNIQUE(user_id, book_id, chapter, verse)
);

-- Reading progress tracking
-- Synced with server so users can switch devices
-- Reading progress tracking
-- Synced with server so users can switch devices
CREATE TABLE user_reading_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    plan_id INTEGER NOT NULL,  -- Server-side reading plan ID
    current_day INTEGER NOT NULL DEFAULT 1,
    completed_days TEXT,  -- JSON array: "[1,2,3,4,5]"
    started_at TEXT NOT NULL,
    last_read_at TEXT,
    synced_at TEXT,
    -- Conflict resolution
    updated_at TEXT DEFAULT (datetime('now')), -- Added for consistency
    version INTEGER DEFAULT 1,
    last_modified_device TEXT,

    UNIQUE(user_id, plan_id)
);

-- User notes (personal Bible study notes)
-- User notes (personal Bible study notes)
-- NORMALIZED: Tags removed to separate table
CREATE TABLE user_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id INTEGER,  -- NULL if note applies to multiple passages
    chapter INTEGER,
    verse INTEGER,
    title TEXT,
    content TEXT NOT NULL,
    -- REMOVED: tags TEXT (no longer storing as JSON)
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    server_id INTEGER,
    -- Conflict resolution
    version INTEGER DEFAULT 1,
    last_modified_device TEXT,
    
    FOREIGN KEY (book_id) REFERENCES bible_books(id)
);

-- ================================================================
-- NORMALIZED TAGS SYSTEM
-- ================================================================

-- New table: All available tags (controlled vocabulary)
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    tag_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    -- Conflict resolution triggers need these for consistency, though tags are simple
    version INTEGER DEFAULT 1, 
    last_modified_device TEXT, 
    synced_at TEXT,
    
    -- Each user can only create a tag name once (case-insensitive)
    UNIQUE(user_id, tag_name COLLATE NOCASE)
);

-- Join table: Links notes to tags (many-to-many relationship)
CREATE TABLE note_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    -- Conflict resolution
    version INTEGER DEFAULT 1,
    last_modified_device TEXT,
    synced_at TEXT,
    
    FOREIGN KEY (note_id) REFERENCES user_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    
    UNIQUE(note_id, tag_id)
);

-- Note Indexes (Updated)
CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);
CREATE INDEX idx_note_tags_note ON note_tags(note_id);
CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, tag_name COLLATE NOCASE);

-- ================================================================
-- SECTION 3: SEARCH & PERFORMANCE
-- ================================================================

-- Full-text search index for Bible verses
-- Enables fast "search the Bible" functionality
CREATE VIRTUAL TABLE bible_verses_fts USING fts5(
    book_name,
    chapter,
    verse,
    text
);

-- Triggers to keep FTS index updated
-- Triggers to keep FTS index updated
CREATE TRIGGER bible_verses_fts_insert AFTER INSERT ON bible_verses BEGIN
    INSERT INTO bible_verses_fts(rowid, book_name, chapter, verse, text)
    SELECT
        NEW.id,
        b.name,
        NEW.chapter,
        NEW.verse,
        NEW.text
    FROM bible_books b WHERE b.id = NEW.book_id;
END;

-- UPDATE trigger: delete then insert
CREATE TRIGGER bible_verses_fts_update AFTER UPDATE ON bible_verses BEGIN
    DELETE FROM bible_verses_fts WHERE rowid = OLD.id;
    INSERT INTO bible_verses_fts(rowid, book_name, chapter, verse, text)
    SELECT
        NEW.id,
        b.name,
        NEW.chapter,
        NEW.verse,
        NEW.text
    FROM bible_books b WHERE b.id = NEW.book_id;
END;

-- DELETE trigger: remove from index
CREATE TRIGGER bible_verses_fts_delete AFTER DELETE ON bible_verses BEGIN
    DELETE FROM bible_verses_fts WHERE rowid = OLD.id;
END;

-- ================================================================
-- INDEXES FOR PERFORMANCE (CRITICAL for mobile)
-- ================================================================

-- Bible verse lookups (most common operation)
CREATE INDEX idx_bible_verses_lookup 
ON bible_verses(translation, book_id, chapter, verse);

CREATE INDEX idx_bible_verses_book 
ON bible_verses(book_id);

-- Cross-reference lookups
CREATE INDEX idx_cross_ref_from 
ON bible_cross_references(from_book, from_chapter, from_verse);

CREATE INDEX idx_cross_ref_to 
ON bible_cross_references(to_book, to_chapter, to_verse_start);

-- Word mappings (for clickable word tool - MOST CRITICAL)
CREATE INDEX idx_word_mapping_lookup 
ON word_strongs_mapping(translation, book_id, chapter, verse);

CREATE INDEX idx_word_mapping_word 
ON word_strongs_mapping(english_word);

CREATE INDEX idx_word_mapping_strongs 
ON word_strongs_mapping(strongs_number);

-- User data indexes
CREATE INDEX idx_highlights_user 
ON user_highlights(user_id);

CREATE INDEX idx_highlights_not_synced 
ON user_highlights(user_id, synced_at) WHERE synced_at IS NULL;

CREATE INDEX idx_bookmarks_user 
ON user_bookmarks(user_id);

CREATE INDEX idx_memory_verses_user 
ON user_memory_verses(user_id);

CREATE INDEX idx_memory_verses_review 
ON user_memory_verses(user_id, next_review_date);

-- ================================================================
-- METADATA TABLE (App version, last update, etc.)
-- ================================================================

-- ================================================================
-- CONFLICT RESOLUTION & SYNC TRIGGERS
-- ================================================================

-- Trigger Template: Auto-increment version on update
-- Applied to: user_highlights, user_bookmarks, user_memory_verses, user_reading_progress, user_notes

-- Trigger Template: Auto-increment version on update
-- Applied to: user_highlights, user_bookmarks, user_memory_verses, user_reading_progress, user_notes

CREATE TRIGGER user_highlights_version_update 
AFTER UPDATE ON user_highlights
FOR EACH ROW
WHEN NEW.version = OLD.version
BEGIN
    UPDATE user_highlights 
    SET version = version + 1, updated_at = datetime('now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER user_bookmarks_version_update 
AFTER UPDATE ON user_bookmarks
FOR EACH ROW
WHEN NEW.version = OLD.version
BEGIN
    UPDATE user_bookmarks 
    SET version = version + 1, updated_at = datetime('now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER user_memory_verses_version_update 
AFTER UPDATE ON user_memory_verses
FOR EACH ROW
WHEN NEW.version = OLD.version
BEGIN
    UPDATE user_memory_verses 
    SET version = version + 1, updated_at = datetime('now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER user_notes_version_update 
AFTER UPDATE ON user_notes
FOR EACH ROW
WHEN NEW.version = OLD.version
BEGIN
    UPDATE user_notes 
    SET version = version + 1, updated_at = datetime('now')
    WHERE id = NEW.id;
END;

CREATE TRIGGER user_reading_progress_version_update 
AFTER UPDATE ON user_reading_progress
FOR EACH ROW
WHEN NEW.version = OLD.version
BEGIN
    UPDATE user_reading_progress 
    SET version = version + 1, updated_at = datetime('now')
    WHERE id = NEW.id;
END;

-- ================================================================
-- DELETION TRACKING (Tombstones)
-- ================================================================

CREATE TABLE deleted_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL CHECK (table_name IN (
        'user_highlights', 'user_bookmarks', 'user_memory_verses',
        'user_reading_progress', 'user_notes', 'note_tags', 'tags'
    )),
    server_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    synced_at TEXT,
    UNIQUE(table_name, server_id)
);

CREATE INDEX idx_deleted_items_not_synced ON deleted_items(user_id, synced_at) WHERE synced_at IS NULL;
CREATE INDEX idx_deleted_items_synced ON deleted_items(synced_at) WHERE synced_at IS NOT NULL;

-- Deletion Triggers (Only track if item was synced i.e. has server_id)

CREATE TRIGGER user_highlights_track_deletion AFTER DELETE ON user_highlights
FOR EACH ROW WHEN OLD.server_id IS NOT NULL
BEGIN
    INSERT INTO deleted_items (table_name, server_id, user_id, deleted_at)
    VALUES ('user_highlights', OLD.server_id, OLD.user_id, datetime('now'));
END;

CREATE TRIGGER user_bookmarks_track_deletion AFTER DELETE ON user_bookmarks
FOR EACH ROW WHEN OLD.server_id IS NOT NULL
BEGIN
    INSERT INTO deleted_items (table_name, server_id, user_id, deleted_at)
    VALUES ('user_bookmarks', OLD.server_id, OLD.user_id, datetime('now'));
END;

CREATE TRIGGER user_memory_verses_track_deletion AFTER DELETE ON user_memory_verses
FOR EACH ROW WHEN OLD.server_id IS NOT NULL
BEGIN
    INSERT INTO deleted_items (table_name, server_id, user_id, deleted_at)
    VALUES ('user_memory_verses', OLD.server_id, OLD.user_id, datetime('now'));
END;

CREATE TRIGGER user_reading_progress_track_deletion AFTER DELETE ON user_reading_progress
FOR EACH ROW WHEN OLD.server_id IS NOT NULL
BEGIN
    INSERT INTO deleted_items (table_name, server_id, user_id, deleted_at)
    VALUES ('user_reading_progress', OLD.server_id, OLD.user_id, datetime('now'));
END;

CREATE TRIGGER user_notes_track_deletion AFTER DELETE ON user_notes
FOR EACH ROW WHEN OLD.server_id IS NOT NULL
BEGIN
    INSERT INTO deleted_items (table_name, server_id, user_id, deleted_at)
    VALUES ('user_notes', OLD.server_id, OLD.user_id, datetime('now'));
END;

CREATE TRIGGER tags_track_deletion AFTER DELETE ON tags
FOR EACH ROW WHEN OLD.id IS NOT NULL -- Tags use local ID for sync in this design? Re-verify implementation plan. User output said "Tags don't have server_id, using local id". But wait, if they sync, they usually have server_id. Let's start with local ID as requested
BEGIN
    INSERT INTO deleted_items (table_name, server_id, user_id, deleted_at)
    VALUES ('tags', OLD.id, OLD.user_id, datetime('now'));
END;

-- ================================================================
-- READING LOCATION SHARING
-- ================================================================

CREATE TABLE user_current_location (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER,
    last_updated TEXT NOT NULL,
    synced_at TEXT,
    server_id INTEGER,
    reading_plan_id INTEGER,
    session_start TEXT,
    FOREIGN KEY (book_id) REFERENCES bible_books(id)
);
CREATE INDEX idx_current_location_sync ON user_current_location(user_id, synced_at) WHERE synced_at IS NULL;

CREATE TABLE reading_location_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('public', 'friends', 'private')),
    show_on_profile INTEGER DEFAULT 1,
    share_reading_history INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL,
    synced_at TEXT
);

CREATE TABLE reading_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter_start INTEGER NOT NULL,
    chapter_end INTEGER NOT NULL,
    verse_start INTEGER,
    verse_end INTEGER,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER,
    reading_plan_id INTEGER,
    synced_at TEXT,
    server_id INTEGER,
    FOREIGN KEY (book_id) REFERENCES bible_books(id)
);
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id, started_at DESC);
CREATE INDEX idx_reading_sessions_not_synced ON reading_sessions(user_id, synced_at) WHERE synced_at IS NULL;

CREATE VIEW v_user_reading_status AS
SELECT 
    ucl.user_id, ucl.book_id, bb.name as book_name, bb.testament, ucl.chapter, ucl.verse,
    ucl.last_updated, ucl.reading_plan_id, rlp.visibility, rlp.show_on_profile,
    bb.name || ' ' || ucl.chapter || CASE WHEN ucl.verse IS NOT NULL THEN ':' || ucl.verse ELSE '' END as readable_reference
FROM user_current_location ucl
JOIN bible_books bb ON bb.id = ucl.book_id
LEFT JOIN reading_location_preferences rlp ON rlp.user_id = ucl.user_id;

CREATE TRIGGER update_current_reading_location
AFTER UPDATE ON user_reading_progress
FOR EACH ROW
BEGIN
    INSERT INTO user_current_location (user_id, book_id, chapter, last_updated, reading_plan_id)
    VALUES (NEW.user_id, 1, NEW.current_day, datetime('now'), NEW.plan_id) -- Placeholder book_id=1
    ON CONFLICT(user_id) DO UPDATE SET last_updated = datetime('now'), synced_at = NULL;
END;

-- ================================================================
-- METADATA TABLE (App version, last update, etc.)
-- ================================================================

CREATE TABLE database_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Insert initial metadata
INSERT INTO database_metadata (key, value, updated_at) VALUES
('version', '1.1.0', datetime('now')), -- Bumped version
('bible_version', 'KJV', datetime('now')),
('last_updated', datetime('now'), datetime('now')),
('schema_version', '2', datetime('now')); -- Bumped schema version

-- ================================================================
-- SAMPLE DATA (for reference - actual data from scrollmapper)
-- ================================================================

-- Insert KJV translation
INSERT INTO bible_translations (translation, title, language, has_strongs) VALUES
('KJV', 'King James Version (1769)', 'en', 1);

-- Insert all 66 Bible books
INSERT INTO bible_books (id, book_number, name, testament, chapters) VALUES
-- Old Testament
(1, 1, 'Genesis', 'OT', 50),
(2, 2, 'Exodus', 'OT', 40),
(3, 3, 'Leviticus', 'OT', 27),
(4, 4, 'Numbers', 'OT', 36),
(5, 5, 'Deuteronomy', 'OT', 34),
(6, 6, 'Joshua', 'OT', 24),
(7, 7, 'Judges', 'OT', 21),
(8, 8, 'Ruth', 'OT', 4),
(9, 9, '1 Samuel', 'OT', 31),
(10, 10, '2 Samuel', 'OT', 24),
(11, 11, '1 Kings', 'OT', 22),
(12, 12, '2 Kings', 'OT', 25),
(13, 13, '1 Chronicles', 'OT', 29),
(14, 14, '2 Chronicles', 'OT', 36),
(15, 15, 'Ezra', 'OT', 10),
(16, 16, 'Nehemiah', 'OT', 13),
(17, 17, 'Esther', 'OT', 10),
(18, 18, 'Job', 'OT', 42),
(19, 19, 'Psalms', 'OT', 150),
(20, 20, 'Proverbs', 'OT', 31),
(21, 21, 'Ecclesiastes', 'OT', 12),
(22, 22, 'Song of Solomon', 'OT', 8),
(23, 23, 'Isaiah', 'OT', 66),
(24, 24, 'Jeremiah', 'OT', 52),
(25, 25, 'Lamentations', 'OT', 5),
(26, 26, 'Ezekiel', 'OT', 48),
(27, 27, 'Daniel', 'OT', 12),
(28, 28, 'Hosea', 'OT', 14),
(29, 29, 'Joel', 'OT', 3),
(30, 30, 'Amos', 'OT', 9),
(31, 31, 'Obadiah', 'OT', 1),
(32, 32, 'Jonah', 'OT', 4),
(33, 33, 'Micah', 'OT', 7),
(34, 34, 'Nahum', 'OT', 3),
(35, 35, 'Habakkuk', 'OT', 3),
(36, 36, 'Zephaniah', 'OT', 3),
(37, 37, 'Haggai', 'OT', 2),
(38, 38, 'Zechariah', 'OT', 14),
(39, 39, 'Malachi', 'OT', 4),
-- New Testament
(40, 40, 'Matthew', 'NT', 28),
(41, 41, 'Mark', 'NT', 16),
(42, 42, 'Luke', 'NT', 24),
(43, 43, 'John', 'NT', 21),
(44, 44, 'Acts', 'NT', 28),
(45, 45, 'Romans', 'NT', 16),
(46, 46, '1 Corinthians', 'NT', 16),
(47, 47, '2 Corinthians', 'NT', 13),
(48, 48, 'Galatians', 'NT', 6),
(49, 49, 'Ephesians', 'NT', 6),
(50, 50, 'Philippians', 'NT', 4),
(51, 51, 'Colossians', 'NT', 4),
(52, 52, '1 Thessalonians', 'NT', 5),
(53, 53, '2 Thessalonians', 'NT', 3),
(54, 54, '1 Timothy', 'NT', 6),
(55, 55, '2 Timothy', 'NT', 4),
(56, 56, 'Titus', 'NT', 3),
(57, 57, 'Philemon', 'NT', 1),
(58, 58, 'Hebrews', 'NT', 13),
(59, 59, 'James', 'NT', 5),
(60, 60, '1 Peter', 'NT', 5),
(61, 61, '2 Peter', 'NT', 3),
(62, 62, '1 John', 'NT', 5),
(63, 63, '2 John', 'NT', 1),
(64, 64, '3 John', 'NT', 1),
(65, 65, 'Jude', 'NT', 1),
(66, 66, 'Revelation', 'NT', 22);

-- ================================================================
-- COMMENTS / DOCUMENTATION
-- ================================================================

-- This SQLite database is designed to:
-- 1. Ship embedded with the React Native mobile app
-- 2. Provide 100% offline Bible reading experience
-- 3. Power the "Clickable Word Tool" with instant lookups
-- 4. Store user's personal study data locally
-- 5. Sync user data to PostgreSQL API when online
--
-- Expected database size: ~15-20MB compressed, ~30-40MB uncompressed
-- 
-- Data flow:
-- - Bible data: Read-only, ships with app, never changes
-- - User data: Local-first, syncs to API in background
-- - Social data: API-only, not stored locally (requires internet)
