import React, { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageCircle, Clock, UserCircle2, Share2, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  id: string;
  content: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  hashtags: string[];
  voteCount: number;
  commentCount: number;
  userVote: number | null;
}

const HASHTAG_COLORS: Record<string, string> = {
  bus: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  transport: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  mess: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  canteen: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  fest: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  events: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  memes: "bg-green-500/10 text-green-600 border-green-500/20",
  fun: "bg-green-500/10 text-green-600 border-green-500/20",
  study: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  academic: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  general: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const PostCard: React.FC<PostCardProps> = ({
  id, content, authorName, isAnonymous, createdAt, hashtags,
  voteCount: initialVoteCount, commentCount, userVote: initialUserVote,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [voting, setVoting] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleVote = async (voteType: number) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    if (voting) return;
    setVoting(true);
    try {
      if (userVote === voteType) {
        await supabase.from("votes").delete().eq("post_id", id).eq("user_id", user.id);
        setVoteCount((v) => v - voteType);
        setUserVote(null);
      } else {
        if (userVote !== null) {
          await supabase.from("votes").delete().eq("post_id", id).eq("user_id", user.id);
          setVoteCount((v) => v - userVote);
        }
        await supabase.from("votes").insert({ post_id: id, user_id: user.id, vote_type: voteType });
        setVoteCount((v) => v + voteType);
        setUserVote(voteType);
      }
    } catch {
      toast.error("Vote failed");
    } finally {
      setVoting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: "UniBuzz Post", text: content.slice(0, 100), url: `${window.location.origin}/post/${id}` });
    } catch {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
      toast.success("Link copied!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Hot post indicator */}
        {voteCount >= 5 && (
          <div className="h-1 w-full gradient-primary" />
        )}
        <CardContent className="p-4">
          {/* Author + time */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {isAnonymous ? "?" : authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-medium">
                {isAnonymous ? "Anonymous Student" : authorName}
              </span>
              <span className="block text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </div>
            {voteCount >= 5 && (
              <Badge className="ml-auto gradient-accent text-accent-foreground text-[10px]">🔥 Hot</Badge>
            )}
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed mb-3 cursor-pointer" onClick={() => navigate(`/post/${id}`)}>
            {content}
          </p>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-xs ${HASHTAG_COLORS[tag.toLowerCase()] || HASHTAG_COLORS.general}`}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-2 border-t border-border/50">
            <button
              onClick={() => handleVote(1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-all ${
                userVote === 1
                  ? "text-primary bg-primary/10 font-semibold"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <span className={`text-sm font-bold min-w-[2ch] text-center ${
              voteCount > 0 ? "text-primary" : voteCount < 0 ? "text-destructive" : "text-muted-foreground"
            }`}>
              {voteCount}
            </span>
            <button
              onClick={() => handleVote(-1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-all ${
                userVote === -1
                  ? "text-destructive bg-destructive/10 font-semibold"
                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>

            <button
              onClick={() => navigate(`/post/${id}`)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all ml-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </button>

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleShare}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setSaved(!saved); toast.success(saved ? "Removed from saved" : "Saved!"); }}
                className={`p-1.5 rounded-md transition-all ${
                  saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PostCard;
