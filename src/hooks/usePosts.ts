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

export function usePosts(hashtag?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for new/updated/deleted posts
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["posts"] });
          queryClient.invalidateQueries({ queryKey: ["comments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["posts", hashtag, user?.id],
    queryFn: async (): Promise<PostWithMeta[]> => {
      let postQuery = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);

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
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.id);
      const authorIds = [...new Set(posts.map((p) => p.author_id))];

      const [profilesRes, hashtagsRes, votesRes, commentsRes, userVotesRes] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name").in("id", authorIds),
        supabase.from("post_hashtags").select("post_id, hashtag").in("post_id", postIds),
        supabase.from("votes").select("post_id, vote_type").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds),
        user
          ? supabase.from("votes").select("post_id, vote_type").in("post_id", postIds).eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.display_name || p.username]));
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
    enabled: query.trim().length > 0,
  });
}

export function useTrendingPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trending-posts", user?.id],
    queryFn: async (): Promise<PostWithMeta[]> => {
      // Get all votes to find trending posts
      const { data: allVotes } = await supabase
        .from("votes")
        .select("post_id, vote_type");

      if (!allVotes || allVotes.length === 0) return [];

      // Aggregate votes per post
      const voteAgg = new Map<string, number>();
      allVotes.forEach((v) => {
        voteAgg.set(v.post_id, (voteAgg.get(v.post_id) || 0) + v.vote_type);
      });

      // Sort by vote count desc, take top 10
      const topPostIds = [...voteAgg.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      if (topPostIds.length === 0) return [];

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .in("id", topPostIds);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.id);
      const authorIds = [...new Set(posts.map((p) => p.author_id))];

      const [profilesRes, hashtagsRes, commentsRes, userVotesRes] = await Promise.all([
        supabase.from("profiles").select("id, username, display_name").in("id", authorIds),
        supabase.from("post_hashtags").select("post_id, hashtag").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds),
        user
          ? supabase.from("votes").select("post_id, vote_type").in("post_id", postIds).eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.display_name || p.username]));
      const hashtagMap = new Map<string, string[]>();
      (hashtagsRes.data || []).forEach((h) => {
        const existing = hashtagMap.get(h.post_id) || [];
        existing.push(h.hashtag);
        hashtagMap.set(h.post_id, existing);
      });
      const commentMap = new Map<string, number>();
      (commentsRes.data || []).forEach((c) => {
        commentMap.set(c.post_id, (commentMap.get(c.post_id) || 0) + 1);
      });
      const userVoteMap = new Map<string, number>();
      (userVotesRes.data || []).forEach((v) => {
        userVoteMap.set(v.post_id, v.vote_type);
      });

      return posts
        .map((post) => ({
          id: post.id,
          content: post.content,
          author_id: post.author_id,
          is_anonymous: post.is_anonymous,
          created_at: post.created_at,
          authorName: profileMap.get(post.author_id) || "Unknown",
          hashtags: hashtagMap.get(post.id) || [],
          voteCount: voteAgg.get(post.id) || 0,
          commentCount: commentMap.get(post.id) || 0,
          userVote: userVoteMap.get(post.id) ?? null,
        }))
        .sort((a, b) => b.voteCount - a.voteCount);
    },
  });
}
