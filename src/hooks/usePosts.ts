import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

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

// Shared helper to enrich posts with metadata
async function enrichPosts(
  posts: any[],
  userId: string | undefined
): Promise<PostWithMeta[]> {
  if (!posts || posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [profilesRes, hashtagsRes, voteCounts, commentsRes, userVotesRes] = await Promise.all([
    supabase.from("profiles_public" as any).select("id, username, display_name").in("id", authorIds),
    supabase.from("post_hashtags").select("post_id, hashtag").in("post_id", postIds),
    supabase.rpc("get_post_vote_counts", { post_ids: postIds }),
    supabase.from("comments").select("post_id").in("post_id", postIds),
    userId
      ? supabase.from("votes").select("post_id, vote_type").in("post_id", postIds).eq("user_id", userId)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    ((profilesRes.data as any[]) || []).map((p: any) => [p.id, p.display_name || p.username])
  );
  const hashtagMap = new Map<string, string[]>();
  (hashtagsRes.data || []).forEach((h) => {
    const existing = hashtagMap.get(h.post_id) || [];
    existing.push(h.hashtag);
    hashtagMap.set(h.post_id, existing);
  });
  const voteMap = new Map<string, number>();
  ((voteCounts.data as any[]) || []).forEach((v: any) => {
    voteMap.set(v.post_id, Number(v.vote_count));
  });
  const commentMap = new Map<string, number>();
  (commentsRes.data || []).forEach((c) => {
    commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1);
  });
  const userVoteMap = new Map<string, number>();
  ((userVotesRes.data as any[]) || []).forEach((v: any) => {
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
}

export function usePosts(hashtag?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        queryClient.invalidateQueries({ queryKey: ["comments"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["posts", hashtag, user?.id],
    queryFn: async (): Promise<PostWithMeta[]> => {
      let postQuery = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);

      if (hashtag) {
        const { data: hashtagData } = await supabase
          .from("post_hashtags")
          .select("post_id")
          .eq("hashtag", hashtag);
        const filteredPostIds = hashtagData?.map((h) => h.post_id) || [];
        if (filteredPostIds.length === 0) return [];
        postQuery = postQuery.in("id", filteredPostIds);
      }

      const { data: posts, error } = await postQuery;
      if (error) throw error;
      return enrichPosts(posts || [], user?.id);
    },
  });
}

export function useSearchPosts(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["search-posts", query, user?.id],
    queryFn: async (): Promise<PostWithMeta[]> => {
      if (!query.trim()) return [];
      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return enrichPosts(posts || [], user?.id);
    },
    enabled: query.trim().length > 0,
  });
}

export function useTrendingPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trending-posts", user?.id],
    queryFn: async (): Promise<PostWithMeta[]> => {
      const { data: trending } = await supabase.rpc("get_trending_post_ids", { limit_count: 10 });
      if (!trending || trending.length === 0) return [];

      const topPostIds = trending.map((t: any) => t.post_id);
      const { data: posts, error } = await supabase.from("posts").select("*").in("id", topPostIds);
      if (error) throw error;

      const enriched = await enrichPosts(posts || [], user?.id);
      return enriched.sort((a, b) => b.voteCount - a.voteCount);
    },
  });
}
