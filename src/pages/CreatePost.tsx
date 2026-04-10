import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Eye, EyeOff, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const AVAILABLE_TAGS = ["bus", "mess", "canteen", "fest", "memes", "study", "general"];

const TAG_EMOJIS: Record<string, string> = {
  bus: "🚌", mess: "🍽️", canteen: "☕", fest: "🎉", memes: "😂", study: "📚", general: "💬",
};

const CreatePost = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(profile?.anonymous_default || false);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in to post"); return; }
    if (!content.trim()) { toast.error("Write something first!"); return; }
    if (selectedTags.length === 0) { toast.error("Select at least one topic tag"); return; }

    setLoading(true);
    try {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({ content: content.trim(), author_id: user.id, is_anonymous: isAnonymous })
        .select()
        .single();
      if (postError) throw postError;

      const hashtagInserts = selectedTags.map((tag) => ({ post_id: post.id, hashtag: tag }));
      const { error: tagError } = await supabase.from("post_hashtags").insert(hashtagInserts);
      if (tagError) throw tagError;

      toast.success("Posted! 🔥");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const charPercent = Math.min((content.length / 1000) * 100, 100);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 gradient-secondary px-4 py-4 safe-area-top">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary-foreground" />
          <div>
            <h1 className="text-xl font-bold font-display text-secondary-foreground">Create Post</h1>
            <p className="text-secondary-foreground/60 text-xs">Share what's on your mind</p>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 mt-4"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Textarea
              placeholder="What's buzzing? Share your thoughts, updates, or memes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[160px] text-base resize-none rounded-xl border-2 focus:border-primary/50 transition-colors"
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-1.5 px-1">
              <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-primary rounded-full"
                  animate={{ width: `${charPercent}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${content.length > 900 ? "text-destructive" : "text-muted-foreground"}`}>
                {content.length}/1000
              </span>
            </div>
          </div>

          {/* Tag selector */}
          <div className="space-y-2.5">
            <Label className="font-display text-sm">Topic Tags</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <motion.div key={tag} whileTap={{ scale: 0.9 }}>
                  <Badge
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer text-sm px-3 py-1.5 transition-all ${
                      selectedTags.includes(tag)
                        ? "gradient-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {TAG_EMOJIS[tag]} #{tag}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Anonymous toggle */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2.5">
              <AnimatePresence mode="wait">
                <motion.div key={isAnonymous ? "off" : "on"} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }}>
                  {isAnonymous ? <EyeOff className="h-5 w-5 text-primary" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                </motion.div>
              </AnimatePresence>
              <div>
                <Label htmlFor="anon" className="text-sm font-medium">Post anonymously</Label>
                <p className="text-[11px] text-muted-foreground">Your identity will be hidden</p>
              </div>
            </div>
            <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </motion.div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              disabled={loading || !content.trim() || selectedTags.length === 0}
              className="w-full gradient-glow text-primary-foreground h-12 text-base font-display shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? (
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                  Posting...
                </motion.span>
              ) : (
                <>Post It <Send className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.main>
    </div>
  );
};

export default CreatePost;
