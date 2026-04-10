
-- Function to get aggregate vote counts for a list of posts
CREATE OR REPLACE FUNCTION public.get_post_vote_counts(post_ids uuid[])
RETURNS TABLE(post_id uuid, vote_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.post_id, COALESCE(SUM(v.vote_type), 0) as vote_count
  FROM public.votes v
  WHERE v.post_id = ANY(post_ids)
  GROUP BY v.post_id;
$$;

-- Function to get trending post IDs by vote count
CREATE OR REPLACE FUNCTION public.get_trending_post_ids(limit_count int DEFAULT 10)
RETURNS TABLE(post_id uuid, vote_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.post_id, COALESCE(SUM(v.vote_type), 0) as vote_count
  FROM public.votes v
  GROUP BY v.post_id
  ORDER BY vote_count DESC
  LIMIT limit_count;
$$;
