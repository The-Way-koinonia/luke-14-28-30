-- database/migrations/004_create_strongs_tables.sql

-- Greek Strong's Dictionary
CREATE TABLE strongs_greek (
    strongs_number VARCHAR(10) PRIMARY KEY,
    lemma TEXT NOT NULL,
    transliteration VARCHAR(255),
    pronunciation VARCHAR(255),
    definition TEXT NOT NULL,
    derivation TEXT
);

CREATE INDEX idx_strongs_greek_number ON strongs_greek(strongs_number);

-- Hebrew Strong's Dictionary  
CREATE TABLE strongs_hebrew (
    strongs_number VARCHAR(10) PRIMARY KEY,
    lemma TEXT NOT NULL,
    transliteration VARCHAR(255),
    pronunciation VARCHAR(255),
    definition TEXT NOT NULL,
    derivation TEXT
);

CREATE INDEX idx_strongs_hebrew_number ON strongs_hebrew(strongs_number);

-- Word-level mappings
CREATE TABLE verse_words (
    id SERIAL PRIMARY KEY,
    book_id INT REFERENCES "KJV_books"(id),
    chapter INT NOT NULL,
    verse INT NOT NULL,
    word_position INT NOT NULL,
    word_text TEXT NOT NULL,
    strongs_number VARCHAR(10)
);

CREATE INDEX idx_verse_words_lookup ON verse_words(book_id, chapter, verse);
CREATE INDEX idx_verse_words_strongs ON verse_words(strongs_number);