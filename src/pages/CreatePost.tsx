import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const AVAILABLE_TAGS = ["bus", "mess", "canteen", "fest", "memes", "study", "general"];

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
    if (!user) {
      toast.error("Please sign in to post");
      return;
    }
    if (!content.trim()) {
      toast.error("Write something first!");
      return;
    }
    if (selectedTags.length === 0) {
      toast.error("Select at least one topic tag");
      return;
    }

    setLoading(true);
    try {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({ content: content.trim(), author_id: user.id, is_anonymous: isAnonymous })
        .select()
        .single();

      if (postError) throw postError;

      // Insert hashtags
      const hashtagInserts = selectedTags.map((tag) => ({
        post_id: post.id,
        hashtag: tag,
      }));
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

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 gradient-secondary px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold font-display text-secondary-foreground">Create Post</h1>
          <p className="text-secondary-foreground/70 text-xs">Share what's on your mind</p>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 mt-4"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Textarea
              placeholder="What's buzzing? Share your thoughts, updates, or memes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] text-base resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{content.length}/1000</p>
          </div>

          {/* Tag selector */}
          <div className="space-y-2">
            <Label className="font-display">Topic Tags</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer text-sm px-3 py-1 transition-all ${
                    selectedTags.includes(tag)
                      ? "gradient-primary text-primary-foreground shadow-md"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              <Label htmlFor="anon" className="text-sm">Post anonymously</Label>
            </div>
            <Switch id="anon" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          <Button
            type="submit"
            disabled={loading || !content.trim() || selectedTags.length === 0}
            className="w-full gradient-primary text-primary-foreground h-12 text-base font-display"
          >
            {loading ? "Posting..." : <>Post It <Send className="ml-2 h-5 w-5" /></>}
          </Button>
        </form>
      </motion.main>
    </div>
  );
};

export default CreatePost;
