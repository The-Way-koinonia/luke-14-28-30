-- Greek Strong's Dictionary
CREATE TABLE IF NOT EXISTS strongs_greek (
    id SERIAL PRIMARY KEY,
    strongs_number VARCHAR(10) NOT NULL UNIQUE, -- e.g. 'G746'
    lemma TEXT,                                 -- Greek word
    transliteration VARCHAR(255),               -- e.g. 'arche'
    pronunciation VARCHAR(255),
    definition TEXT,
    derivation TEXT
);

CREATE INDEX IF NOT EXISTS idx_strongs_greek_number ON strongs_greek(strongs_number);

-- Hebrew Strong's Dictionary
CREATE TABLE IF NOT EXISTS strongs_hebrew (
    id SERIAL PRIMARY KEY,
    strongs_number VARCHAR(10) NOT NULL UNIQUE, -- e.g. 'H430'
    lemma TEXT,                                 -- Hebrew word
    transliteration VARCHAR(255),               -- e.g. 'elohim'
    pronunciation VARCHAR(255),
    definition TEXT,
    derivation TEXT
);

CREATE INDEX IF NOT EXISTS idx_strongs_hebrew_number ON strongs_hebrew(strongs_number);

-- Word-level Strong's mappings
CREATE TABLE IF NOT EXISTS verse_words (
    id SERIAL PRIMARY KEY,
    book_id INT NOT NULL,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    word_position INT NOT NULL,      -- Position in verse (0, 1, 2...)
    word_text TEXT NOT NULL,         -- English word
    strongs_number VARCHAR(10),      -- 'G746' or 'H430'
    grammar_code VARCHAR(50),        -- Optional: morphology
    FOREIGN KEY (strongs_number) REFERENCES strongs_greek(strongs_number) ON DELETE SET NULL,
    FOREIGN KEY (strongs_number) REFERENCES strongs_hebrew(strongs_number) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_verse_words_lookup ON verse_words(book_id, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_verse_words_strongs ON verse_words(strongs_number);