import React from "react";
import { motion } from "framer-motion";
import { RefreshCw, Zap } from "lucide-react";
import PostCard from "@/components/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: posts, isLoading, refetch, isRefetching } = usePosts();

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 gradient-primary px-4 py-4 pb-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-primary-foreground flex items-center gap-2">
              <Zap className="h-6 w-6" /> UniBuzz
            </h1>
            <p className="text-primary-foreground/70 text-xs">What's buzzing on campus?</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-lg mx-auto px-4 -mt-2 space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))
        ) : posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              content={post.content}
              authorName={post.authorName}
              isAnonymous={post.is_anonymous}
              createdAt={post.created_at}
              hashtags={post.hashtags}
              voteCount={post.voteCount}
              commentCount={post.commentCount}
              userVote={post.userVote}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Zap className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <h2 className="text-lg font-display font-semibold text-muted-foreground">No buzz yet!</h2>
            <p className="text-sm text-muted-foreground/70 mt-1">Be the first to post something.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
