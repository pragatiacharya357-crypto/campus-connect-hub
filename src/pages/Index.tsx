import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Zap, Search, TrendingUp, Flame, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import PostCard from "@/components/PostCard";
import { usePosts, useSearchPosts, useTrendingPosts } from "@/hooks/usePosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type FeedTab = "latest" | "trending";

const Index = () => {
  const [activeTab, setActiveTab] = useState<FeedTab>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: posts, isLoading, refetch, isRefetching } = usePosts();
  const { data: trendingPosts, isLoading: trendingLoading } = useTrendingPosts();
  const { data: searchResults, isLoading: searchLoading } = useSearchPosts(searchQuery);

  const isSearching = searchQuery.trim().length > 0;
  const displayPosts = isSearching
    ? searchResults
    : activeTab === "trending"
    ? trendingPosts
    : posts;
  const loading = isSearching ? searchLoading : activeTab === "trending" ? trendingLoading : isLoading;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 gradient-primary px-4 py-4 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold font-display text-primary-foreground flex items-center gap-2">
                <Zap className="h-6 w-6" /> UniBuzz
              </h1>
              <p className="text-primary-foreground/70 text-xs">What's buzzing on campus?</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => refetch()}
                className="p-2 rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              >
                <RefreshCw className={`h-5 w-5 ${isRefetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 bg-primary-foreground/90 border-0 text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed tabs */}
          {!isSearching && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("latest")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === "latest"
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary-foreground/15 text-primary-foreground/80 hover:bg-primary-foreground/25"
                }`}
              >
                <Flame className="h-3.5 w-3.5" /> Latest
              </button>
              <button
                onClick={() => setActiveTab("trending")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeTab === "trending"
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary-foreground/15 text-primary-foreground/80 hover:bg-primary-foreground/25"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" /> Trending
              </button>
            </div>
          )}

          {isSearching && (
            <Badge variant="secondary" className="text-xs">
              Searching: "{searchQuery}"
            </Badge>
          )}
        </div>
      </header>

      {/* Live indicator */}
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs text-muted-foreground">Live feed — updates in real-time</span>
      </div>

      {/* Feed */}
      <main className="max-w-lg mx-auto px-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))
        ) : displayPosts && displayPosts.length > 0 ? (
          <AnimatePresence>
            {displayPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <PostCard
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
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Zap className="h-16 w-16 text-primary/30 mx-auto mb-4" />
            <h2 className="text-lg font-display font-semibold text-muted-foreground">
              {isSearching ? "No results found" : "No buzz yet!"}
            </h2>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {isSearching ? "Try a different search term." : "Be the first to post something."}
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
