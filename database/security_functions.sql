-- Function to grant temporary admin access
-- This function mimics a claim-based or role-based JIT system.
-- It checks if the user is a 'pastor' (eligible) and grants 'admin' role for 1 hour.

CREATE OR REPLACE FUNCTION request_admin_access()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (must be superuser/admin)
AS $$
DECLARE
  current_role user_role;
  new_expiry TIMESTAMPTZ;
BEGIN
  -- Get current user role from public.users table (assuming auth.uid() matches id)
  SELECT user_role INTO current_role FROM public.users WHERE id = auth.uid()::text;

  -- Verify eligibility: Only 'pastor' or 'admin' can request/extend admin access
  IF current_role NOT IN ('pastor', 'admin') THEN
    RAISE EXCEPTION 'Access Denied: You are not eligible for admin privileges.';
  END IF;

  -- Set expiry to 1 hour from now
  new_expiry := NOW() + INTERVAL '1 hour';

  -- In a real Supabase Auth system, we would perform a simpler approach:
  -- 1. Store the request in a `admin_sessions` table.
  -- 2. Update a Custom Claim via an Edge Function (since SQL can't easily update Auth claims directly in all setups).
  --
  -- FOR THIS HYBRID ARCHITECTURE:
  -- We will use a dedicated `admin_sessions` table that RLS policies check against.
  
  INSERT INTO public.admin_sessions (user_id, expires_at)
  VALUES (auth.uid()::text, new_expiry)
  ON CONFLICT (user_id) 
  DO UPDATE SET expires_at = new_expiry;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Admin access granted for 1 hour.',
    'expires_at', new_expiry
  );
END;
$$;

-- Create the sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own session
CREATE POLICY "Users can view own admin session"
ON public.admin_sessions FOR SELECT
USING (user_id = auth.uid()::text);

-- Comment
COMMENT ON FUNCTION request_admin_access IS 'Grants temporary admin access to eligible users (pastors).';
