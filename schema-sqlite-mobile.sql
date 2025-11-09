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
CREATE TABLE user_highlights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,  -- From NextAuth
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    color TEXT NOT NULL CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'orange', 'purple')),
    note TEXT,  -- Optional note attached to highlight
    created_at TEXT NOT NULL,  -- ISO 8601: "2025-01-15T10:30:00Z"
    updated_at TEXT NOT NULL,
    synced_at TEXT,  -- NULL = not yet synced to server
    server_id INTEGER,  -- Server-side ID after sync
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    UNIQUE(user_id, book_id, chapter, verse)
);

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
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    UNIQUE(user_id, book_id, chapter, verse)
);

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
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    UNIQUE(user_id, book_id, chapter, verse)
);

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
    UNIQUE(user_id, plan_id)
);

-- User notes (personal Bible study notes)
CREATE TABLE user_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    book_id INTEGER,  -- NULL if note applies to multiple passages
    chapter INTEGER,
    verse INTEGER,
    title TEXT,
    content TEXT NOT NULL,
    tags TEXT,  -- JSON array: '["prayer", "study"]'
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT,
    server_id INTEGER,
    FOREIGN KEY (book_id) REFERENCES bible_books(id)
);

-- ================================================================
-- SECTION 3: SEARCH & PERFORMANCE
-- ================================================================

-- Full-text search index for Bible verses
-- Enables fast "search the Bible" functionality
CREATE VIRTUAL TABLE bible_verses_fts USING fts5(
    book_name,
    chapter,
    verse,
    text,
    content='bible_verses',
    content_rowid='id'
);

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

CREATE TABLE database_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Insert initial metadata
INSERT INTO database_metadata (key, value, updated_at) VALUES
('version', '1.0.0', datetime('now')),
('bible_version', 'KJV', datetime('now')),
('last_updated', datetime('now'), datetime('now')),
('schema_version', '1', datetime('now'));

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
