// File: app/api/social/posts/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// --- PostgreSQL Connection Pool ---
// This uses the DATABASE_URL environment variable from .env.local
// A connection pool is mandatory for high-performance Node.js applications.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * [SERVICE LAYER FUNCTION]
 * Attempts to connect to the database to ensure it is alive.
 */
async function checkDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    // A simple query to check connectivity
    await client.query('SELECT 1');
    return { success: true };
  } catch (error) {
    console.error("Database Connection Failed:", error);
    return { success: false, error: "Database connection failed." };
  } finally {
    if (client) client.release();
  }
}

/**
 * [API ROUTE - GET]
 * Handles GET requests to /api/social/posts
 * Fetches the latest posts for the social feed.
 */
export async function GET() {
  const dbStatus = await checkDatabaseConnection();
  if (!dbStatus.success) {
    return NextResponse.json({ message: "Database offline", error: dbStatus.error }, { status: 503 });
  }

  let client;
  try {
    client = await pool.connect();

    // Fetch the 50 latest posts, joining with the users table to get the author's username
    const result = await client.query(`
      SELECT
        p.post_id,
        p.content,
        p.likes_count,
        p.bible_reference,
        p.created_at,
        u.username AS author_username,
        u.user_role AS author_role
      FROM posts p
      JOIN users u ON p.author_id = u.user_id
      ORDER BY p.created_at DESC
      LIMIT 50;
    `);

    // Return data in a JSON format
    return NextResponse.json({ posts: result.rows });

  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ message: "Failed to fetch posts", error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

/**
 * [API ROUTE - POST]
 * Handles POST requests to /api/social/posts
 * Creates a new post.
 */
export async function POST(request: Request) {
  let client;
  try {
    const { authorId, content, bibleReference } = await request.json();

    if (!authorId || !content) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    client = await pool.connect();

    // Check if the author exists first (Good practice for referential integrity)
    const userCheck = await client.query('SELECT user_id FROM users WHERE user_id = $1', [authorId]);
    if (userCheck.rowCount === 0) {
        return NextResponse.json({ message: "Author does not exist" }, { status: 404 });
    }

    // Insert the new post into the PostgreSQL database
    const result = await client.query(
      `INSERT INTO posts (author_id, content, bible_reference)
       VALUES ($1, $2, $3)
       RETURNING post_id, created_at;`,
      [authorId, content, bibleReference]
    );

    return NextResponse.json({
      message: "Post created successfully",
      postId: result.rows[0].post_id,
      createdAt: result.rows[0].created_at,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ message: "Failed to create post", error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
