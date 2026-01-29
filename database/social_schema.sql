-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the followers table 
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent someone from following the same person twice
  UNIQUE(follower_id, following_id)
);

-- Create the index for followers table
CREATE INDEX idx_followers_relationship 
ON public.followers(follower_id, following_id);


-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  verse_ref TEXT NOT NULL, -- String-based reference to the verse (e.g., "JHN.3.16")
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policy: Private posts are only visible to the author
CREATE POLICY "Private posts are visible to author only"
ON public.posts
FOR SELECT
USING (
  (visibility = 'private' AND auth.uid() = user_id)
);

-- Policy: Public/Friends posts are visible if user follows author
-- Assuming a 'followers' table exists: followers(follower_id, following_id)
-- For 'public' or 'friends', we typically check if the viewer is the author OR follows the author.
-- Note: Simplified for 'public' to be visible to everyone or just followers?
-- The prompt says: "Public/Friends: Users can see public posts if they follow the author"
-- This implies 'public' isn't truly global public in this context, or it's a specific requirement.
-- strict interpretation: IF visibility IN ('public', 'friends') AND (auth.uid() = user_id OR EXISTS (SELECT 1 FROM followers WHERE follower_id = auth.uid() AND following_id = posts.user_id))

CREATE POLICY "Public and Friends posts visibility"
ON public.posts
FOR SELECT
USING (
  (visibility IN ('public', 'friends'))
  AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.followers
      WHERE follower_id = auth.uid() AND following_id = posts.user_id
    )
  )
);

-- Policy: Insert allowed for authenticated users
CREATE POLICY "Users can create posts"
ON public.posts
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Policy: MFA Enforcement for Update
-- Requires AAL2 (aal2) session
CREATE POLICY "MFA required to update posts"
ON public.posts
FOR UPDATE
USING (
  auth.uid() = user_id
  AND (select auth.jwt() ->> 'aal') = 'aal2'
)
WITH CHECK (
  auth.uid() = user_id
  AND (select auth.jwt() ->> 'aal') = 'aal2'
);

-- Policy: MFA Enforcement for Delete
-- Requires AAL2 (aal2) session
CREATE POLICY "MFA required to delete posts"
ON public.posts
FOR DELETE
USING (
  auth.uid() = user_id
  AND (select auth.jwt() ->> 'aal') = 'aal2'
);

-- ================================================================
-- SERVER-SIDE: Reading Location for Social Features
-- (PostgreSQL schema on your API server)
-- ================================================================

-- Users' current reading locations (synced from mobile)
CREATE TABLE IF NOT EXISTS public.user_reading_locations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Bible reference using the same format as posts
    book_id INTEGER NOT NULL,
    book_name TEXT NOT NULL,  -- Denormalized for faster queries
    chapter INTEGER NOT NULL,
    verse INTEGER,
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reading_plan_id INTEGER,
    
    -- Visibility controls (same pattern as posts)
    visibility TEXT NOT NULL DEFAULT 'friends' 
        CHECK (visibility IN ('public', 'friends', 'private')),
    
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_reading_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can always see their own location
CREATE POLICY "Users can see own reading location"
ON public.user_reading_locations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Public locations visible to followers
CREATE POLICY "Reading locations visible to followers"
ON public.user_reading_locations
FOR SELECT
USING (
    visibility IN ('public', 'friends')
    AND EXISTS (
        SELECT 1 FROM public.followers
        WHERE follower_id = auth.uid() AND following_id = user_id
    )
);

-- Policy: Users can update their own location
CREATE POLICY "Users can update own reading location"
ON public.user_reading_locations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for looking up friends' current reading
CREATE INDEX idx_reading_locations_visible
ON public.user_reading_locations(visibility, last_updated DESC);

-- ================================================================
-- PROFILE BADGE VIEW
-- Returns reading location formatted for display on user profiles
-- ================================================================

CREATE OR REPLACE FUNCTION get_user_reading_badge(target_user_id UUID)
RETURNS TABLE (
    book_name TEXT,
    chapter INTEGER,
    verse INTEGER,
    reference TEXT,
    last_updated TIMESTAMPTZ,
    can_view BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        url.book_name,
        url.chapter,
        url.verse,
        url.book_name || ' ' || url.chapter || 
            CASE WHEN url.verse IS NOT NULL THEN ':' || url.verse ELSE '' END,
        url.last_updated,
        -- Can view if: it's your own profile, or you follow them and it's not private
        (auth.uid() = target_user_id) OR (
            url.visibility != 'private' 
            AND EXISTS (
                SELECT 1 FROM followers 
                WHERE follower_id = auth.uid() AND following_id = target_user_id
            )
        ) as can_view
    FROM user_reading_locations url
    WHERE url.user_id = target_user_id;
END;
$$;
