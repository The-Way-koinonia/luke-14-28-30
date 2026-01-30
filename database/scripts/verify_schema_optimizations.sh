#!/bin/bash
set -e

DB_FILE="test_verification.db"
SCHEMA_FILE="../schema-sqlite-mobile.sql"

# Clean up
rm -f $DB_FILE

echo "Creating test database from schema..."
sqlite3 $DB_FILE < "$SCHEMA_FILE"

echo "Running verification tests..."

# Helper function to run SQL
run_sql() {
    sqlite3 $DB_FILE "PRAGMA foreign_keys = ON; $1"
}

# 1. Test FTS Triggers
echo "--- Testing FTS Triggers ---"
# Insert a book (required for foreign key)
run_sql "INSERT INTO bible_books (id, book_number, name, testament, chapters) VALUES (100, 100, 'Test Book', 'NT', 1);"
# Insert a verse
run_sql "INSERT INTO bible_verses (book_id, chapter, verse, text) VALUES (100, 1, 1, 'In the beginning was the test.');"

# Check FTS
FTS_COUNT=$(run_sql "SELECT count(*) FROM bible_verses_fts WHERE text MATCH 'test';")
if [ "$FTS_COUNT" -eq 1 ]; then echo "✅ FTS Insert: Success"; else echo "❌ FTS Insert: Failed"; exit 1; fi

# Update verse
run_sql "UPDATE bible_verses SET text = 'In the end is the verify.' WHERE book_id=100 AND chapter=1 AND verse=1;"
FTS_NEW_COUNT=$(run_sql "SELECT count(*) FROM bible_verses_fts WHERE text MATCH 'verify';")
FTS_OLD_COUNT=$(run_sql "SELECT count(*) FROM bible_verses_fts WHERE text MATCH 'test';")

if [ "$FTS_NEW_COUNT" -eq 1 ] && [ "$FTS_OLD_COUNT" -eq 0 ]; then echo "✅ FTS Update: Success"; else echo "❌ FTS Update: Failed"; exit 1; fi

# 2. Test Flexible Highlights
echo "--- Testing User Highlights ---"
USER_ID="user_123"
# Insert yellow highlight
run_sql "INSERT INTO user_highlights (user_id, book_id, chapter, verse, color, created_at, updated_at) VALUES ('$USER_ID', 100, 1, 1, 'yellow', datetime('now'), datetime('now'));"

# Insert blue highlight on same verse (should work)
run_sql "INSERT INTO user_highlights (user_id, book_id, chapter, verse, color, created_at, updated_at) VALUES ('$USER_ID', 100, 1, 1, 'blue', datetime('now'), datetime('now'));"
HIGHLIGHT_COUNT=$(run_sql "SELECT count(*) FROM user_highlights WHERE user_id='$USER_ID';")

if [ "$HIGHLIGHT_COUNT" -eq 2 ]; then echo "✅ Multiple Highlights: Success"; else echo "❌ Multiple Highlights: Failed"; exit 1; fi

# Insert duplicate yellow (should fail)
set +e
run_sql "INSERT INTO user_highlights (user_id, book_id, chapter, verse, color, created_at, updated_at) VALUES ('$USER_ID', 100, 1, 1, 'yellow', datetime('now'), datetime('now'));" 2>/dev/null
if [ $? -ne 0 ]; then echo "✅ Duplicate Constraint: Success (Caught expected error)"; else echo "❌ Duplicate Constraint: Failed (Should have errored)"; exit 1; fi
set -e

# 3. Test Conflict Resolution (Version Increment)
echo "--- Testing Conflict Resolution ---"
# Get initial version
INIT_VER=$(run_sql "SELECT version FROM user_highlights WHERE user_id='$USER_ID' AND color='yellow';")
# Update highlight note
run_sql "UPDATE user_highlights SET note = 'Updated note' WHERE user_id='$USER_ID' AND color='yellow';"
NEW_VER=$(run_sql "SELECT version FROM user_highlights WHERE user_id='$USER_ID' AND color='yellow';")

if [ "$NEW_VER" -gt "$INIT_VER" ]; then echo "✅ Version Increment: Success ($INIT_VER -> $NEW_VER)"; else echo "❌ Version Increment: Failed"; exit 1; fi

# 4. Test Deletion Tracking
echo "--- Testing Deletion Tracking ---"
# Simulate sync (set server_id)
run_sql "UPDATE user_highlights SET server_id = 555 WHERE user_id='$USER_ID' AND color='blue';"
# Delete synced highlight
run_sql "DELETE FROM user_highlights WHERE user_id='$USER_ID' AND color='blue';"
# Check tombstone
TOMBSTONE_COUNT=$(run_sql "SELECT count(*) FROM deleted_items WHERE table_name='user_highlights' AND server_id=555;")

if [ "$TOMBSTONE_COUNT" -eq 1 ]; then echo "✅ Deletion Tracking: Success"; else echo "❌ Deletion Tracking: Failed"; exit 1; fi

# Delete unsynced highlight (yellow) - should NOT create tombstone
run_sql "DELETE FROM user_highlights WHERE user_id='$USER_ID' AND color='yellow';" 
# (Yellow didn't have server_id set)
YELLOW_TOMBSTONE=$(run_sql "SELECT count(*) FROM deleted_items WHERE table_name='user_highlights' AND user_id='$USER_ID' AND deleted_at > datetime('now', '-1 minute');")
# We expect 1 total highlight tombstone (for blue), so if we query specifically without server ID constraint we might find the blue one.
# Let's count total tombstones for user
TOTAL_TOMBSTONES=$(run_sql "SELECT count(*) FROM deleted_items WHERE user_id='$USER_ID';")
if [ "$TOTAL_TOMBSTONES" -eq 1 ]; then echo "✅ Unsynced Deletion: Ignored correctly"; else echo "❌ Unsynced Deletion: Failed (Count: $TOTAL_TOMBSTONES)"; exit 1; fi

# 5. Test Normalized Tags
echo "--- Testing User Notes & Tags ---"
# Create Note with explicit ID 1
run_sql "INSERT INTO user_notes (id, user_id, content, created_at, updated_at) VALUES (1, '$USER_ID', 'My Note', datetime('now'), datetime('now'));"
NOTE_ID=1

# Create Tags with explicit ID 1
run_sql "INSERT INTO tags (id, user_id, tag_name, created_at) VALUES (1, '$USER_ID', 'Prayer', datetime('now'));"
TAG_ID=1

# Link Tag
run_sql "INSERT INTO note_tags (note_id, tag_id, created_at) VALUES ($NOTE_ID, $TAG_ID, datetime('now'));"

LINK_COUNT=$(run_sql "SELECT count(*) FROM note_tags WHERE note_id=$NOTE_ID AND tag_id=$TAG_ID;")
if [ "$LINK_COUNT" -eq 1 ]; then echo "✅ Tag Linking: Success"; else echo "❌ Tag Linking: Failed"; exit 1; fi

# Test Cascade Delete
run_sql "DELETE FROM user_notes WHERE id=$NOTE_ID;"
LINK_REMAINING=$(run_sql "SELECT count(*) FROM note_tags WHERE note_id=$NOTE_ID;")
if [ "$LINK_REMAINING" -eq 0 ]; then echo "✅ Tag Cascade Delete: Success"; else echo "❌ Tag Cascade Delete: Failed"; exit 1; fi

# 6. Test Reading Progress Sharing
echo "--- Testing Reading Progress Sharing ---"
# Insert Reading Progress
run_sql "INSERT INTO user_reading_progress (user_id, plan_id, current_day, started_at) VALUES ('$USER_ID', 1, 5, datetime('now'));"
# Update Progress (should trigger location update)
run_sql "UPDATE user_reading_progress SET current_day = 6 WHERE user_id='$USER_ID';"

# Check Current Location
LOC_CHAPTER=$(run_sql "SELECT chapter FROM user_current_location WHERE user_id='$USER_ID';")
if [ "$LOC_CHAPTER" -eq 6 ]; then echo "✅ Current Location Trigger: Success"; else echo "❌ Current Location Trigger: Failed (Chapter: $LOC_CHAPTER)"; exit 1; fi

echo "🎉 All tests passed!"
rm $DB_FILE
