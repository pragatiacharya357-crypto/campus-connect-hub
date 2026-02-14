import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, UserCircle2, Clock, ThumbsUp, ThumbsDown, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(profile?.anonymous_default || false);
  const [submitting, setSubmitting] = useState(false);

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id!).single();
      if (error) throw error;

      const [profileRes, hashtagsRes, votesRes] = await Promise.all([
        supabase.from("profiles").select("username, display_name").eq("id", data.author_id).single(),
        supabase.from("post_hashtags").select("hashtag").eq("post_id", id!),
        supabase.from("votes").select("vote_type").eq("post_id", id!),
      ]);

      const voteCount = (votesRes.data || []).reduce((sum, v) => sum + v.vote_type, 0);

      return {
        ...data,
        authorName: profileRes.data?.display_name || profileRes.data?.username || "Unknown",
        hashtags: (hashtagsRes.data || []).map((h) => h.hashtag),
        voteCount,
      };
    },
    enabled: !!id,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const authorIds = [...new Set(data.map((c) => c.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", authorIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p.display_name || p.username]));

      return data.map((c) => ({
        ...c,
        authorName: profileMap.get(c.author_id) || "Unknown",
      }));
    },
    enabled: !!id,
  });

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: id!,
        author_id: user.id,
        content: commentText.trim(),
        is_anonymous: isAnonymous,
      });
      if (error) throw error;
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (postLoading) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display font-semibold">Post</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {post && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                <span className="font-medium">
                  {post.is_anonymous ? "Anonymous Student" : post.authorName}
                </span>
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="leading-relaxed mb-3">{post.content}</p>
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {post.hashtags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50 text-sm text-muted-foreground">
                <ThumbsUp className="h-4 w-4" />
                <span className="font-bold">{post.voteCount}</span>
                <span className="ml-2">{comments?.length || 0} comments</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <div className="space-y-2">
          <h2 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">Comments</h2>
          {commentsLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : comments && comments.length > 0 ? (
            comments.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border/30">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {c.is_anonymous ? "Anonymous" : c.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{c.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
          )}
        </div>
      </main>

      {/* Comment input */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-3 z-40">
        <form onSubmit={handleComment} className="max-w-lg mx-auto flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[40px] max-h-[100px] resize-none text-sm"
              rows={1}
            />
            <div className="flex items-center gap-1">
              <EyeOff className="h-3 w-3 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">Anon</Label>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} className="scale-75" />
            </div>
          </div>
          <Button type="submit" size="icon" disabled={submitting || !commentText.trim()} className="gradient-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PostDetail;
