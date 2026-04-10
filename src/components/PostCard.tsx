import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, MessageCircle, Clock, Share2, Bookmark, Flame } from "lucide-react";
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
  bus: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  transport: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  mess: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  canteen: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  fest: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  events: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  memes: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  fun: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  study: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  academic: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  general: "bg-muted text-muted-foreground border-border",
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
  const [showVoteAnim, setShowVoteAnim] = useState<number | null>(null);

  const handleVote = async (voteType: number) => {
    if (!user) { toast.error("Sign in to vote"); return; }
    if (voting) return;
    setVoting(true);
    setShowVoteAnim(voteType);
    setTimeout(() => setShowVoteAnim(null), 600);
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

  const isHot = voteCount >= 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Card className="border border-border/40 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {isHot && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="h-1 w-full gradient-glow origin-left"
          />
        )}
        <CardContent className="p-4">
          {/* Author + time */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-md"
            >
              {isAnonymous ? "?" : authorName.charAt(0).toUpperCase()}
            </motion.div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold truncate block">
                {isAnonymous ? "Anonymous Student" : authorName}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </div>
            {isHot && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Badge className="gradient-glow text-primary-foreground text-[10px] border-0 gap-1">
                  <Flame className="h-3 w-3" /> Hot
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Content */}
          <p
            className="text-sm leading-relaxed mb-3 cursor-pointer hover:text-primary/90 transition-colors line-clamp-4"
            onClick={() => navigate(`/post/${id}`)}
          >
            {content}
          </p>

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-[11px] ${HASHTAG_COLORS[tag.toLowerCase()] || HASHTAG_COLORS.general}`}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 pt-2.5 border-t border-border/30">
            <div className="relative">
              <motion.button
                whileTap={{ scale: 1.3 }}
                onClick={() => handleVote(1)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                  userVote === 1
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
              </motion.button>
              <AnimatePresence>
                {showVoteAnim === 1 && (
                  <motion.span
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -20 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-primary font-bold text-xs pointer-events-none"
                  >
                    +1
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.span
              key={voteCount}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`text-sm font-bold min-w-[2ch] text-center ${
                voteCount > 0 ? "text-primary" : voteCount < 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {voteCount}
            </motion.span>

            <div className="relative">
              <motion.button
                whileTap={{ scale: 1.3 }}
                onClick={() => handleVote(-1)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-all ${
                  userVote === -1
                    ? "text-destructive bg-destructive/10 font-semibold"
                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
              </motion.button>
              <AnimatePresence>
                {showVoteAnim === -1 && (
                  <motion.span
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: 20 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-destructive font-bold text-xs pointer-events-none"
                  >
                    -1
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(`/post/${id}`)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all ml-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </motion.button>

            <div className="ml-auto flex items-center gap-0.5">
              <motion.button
                whileTap={{ scale: 0.85, rotate: 15 }}
                onClick={handleShare}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Share2 className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => { setSaved(!saved); toast.success(saved ? "Removed from saved" : "Saved!"); }}
                className={`p-2 rounded-lg transition-all ${
                  saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Bookmark className={`h-4 w-4 transition-all ${saved ? "fill-current scale-110" : ""}`} />
              </motion.button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PostCard;
