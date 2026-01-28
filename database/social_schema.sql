-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
