import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PostWithMeta {
  id: string;
  content: string;
  author_id: string;
  is_anonymous: boolean;
  created_at: string;
  authorName: string;
  hashtags: string[];
  voteCount: number;
  commentCount: number;
  userVote: number | null;
}

export function usePosts(hashtag?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["posts", hashtag, user?.id],
    queryFn: async (): Promise<PostWithMeta[]> => {
      // Get posts
      let postQuery = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);

      // If filtering by hashtag, get post IDs first
      let filteredPostIds: string[] | null = null;
      if (hashtag) {
        const { data: hashtagData } = await supabase
          .from("post_hashtags")
          .select("post_id")
          .eq("hashtag", hashtag);
        filteredPostIds = hashtagData?.map((h) => h.post_id) || [];
        if (filteredPostIds.length === 0) return [];
        postQuery = postQuery.in("id", filteredPostIds);
      }

      const { data: posts, error } = await postQuery;
      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.id);
      const authorIds = [...new Set(posts.map((p) => p.author_id))];

      // Fetch in parallel: profiles, hashtags, votes, comments count, user votes
      const [profilesRes, hashtagsRes, votesRes, commentsRes, userVotesRes] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name").in("id", authorIds),
        supabase.from("post_hashtags").select("post_id, hashtag").in("post_id", postIds),
        supabase.from("votes").select("post_id, vote_type").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds),
        user
          ? supabase.from("votes").select("post_id, vote_type").in("post_id", postIds).eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map(
        (profilesRes.data || []).map((p) => [p.id, p.display_name || p.username])
      );

      const hashtagMap = new Map<string, string[]>();
      (hashtagsRes.data || []).forEach((h) => {
        const existing = hashtagMap.get(h.post_id) || [];
        existing.push(h.hashtag);
        hashtagMap.set(h.post_id, existing);
      });

      const voteMap = new Map<string, number>();
      (votesRes.data || []).forEach((v) => {
        voteMap.set(v.post_id, (voteMap.get(v.post_id) || 0) + v.vote_type);
      });

      const commentMap = new Map<string, number>();
      (commentsRes.data || []).forEach((c) => {
        commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1);
      });

      const userVoteMap = new Map<string, number>();
      (userVotesRes.data || []).forEach((v) => {
        userVoteMap.set(v.post_id, v.vote_type);
      });

      return posts.map((post) => ({
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        is_anonymous: post.is_anonymous,
        created_at: post.created_at,
        authorName: profileMap.get(post.author_id) || "Unknown",
        hashtags: hashtagMap.get(post.id) || [],
        voteCount: voteMap.get(post.id) || 0,
        commentCount: commentMap.get(post.id) || 0,
        userVote: userVoteMap.get(post.id) ?? null,
      }));
    },
  });
}
