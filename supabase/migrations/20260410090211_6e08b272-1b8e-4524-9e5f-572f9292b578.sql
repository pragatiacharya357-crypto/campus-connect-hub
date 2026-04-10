
-- Create a public-safe view for profiles that excludes sensitive data
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT id, username, display_name, avatar_url, verified, anonymous_default, created_at, updated_at
FROM public.profiles;

-- Restrict votes SELECT: users can only see their own votes, but aggregate vote counts are still available
DROP POLICY IF EXISTS "Anyone can view votes" ON public.votes;

CREATE POLICY "Users can view own votes"
ON public.votes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add explicit deny for votes UPDATE
CREATE POLICY "No vote updates allowed"
ON public.votes
FOR UPDATE
TO authenticated
USING (false);
