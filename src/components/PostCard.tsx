import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageCircle, Clock, UserCircle2 } from "lucide-react";
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

  const handleVote = async (voteType: number) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }
    if (voting) return;
    setVoting(true);

    try {
      if (userVote === voteType) {
        // Remove vote
        await supabase.from("votes").delete().eq("post_id", id).eq("user_id", user.id);
        setVoteCount((v) => v - voteType);
        setUserVote(null);
      } else {
        if (userVote !== null) {
          // Change vote
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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Author + time */}
          <div className="flex items-center gap-2 mb-2">
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {isAnonymous ? "Anonymous Student" : authorName}
            </span>
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm leading-relaxed mb-3">{content}</p>

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
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            <button
              onClick={() => handleVote(1)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                userVote === 1 ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
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
              className={`flex items-center gap-1 text-sm transition-colors ${
                userVote === -1 ? "text-destructive font-semibold" : "text-muted-foreground hover:text-destructive"
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate(`/post/${id}`)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PostCard;
