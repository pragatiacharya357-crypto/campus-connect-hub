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
      <header className="sticky top-0 z-40 gradient-primary px-4 pt-4 pb-3 safe-area-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold font-display text-primary-foreground flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Zap className="h-6 w-6" />
                </motion.div>
                UniBuzz
              </h1>
              <p className="text-primary-foreground/60 text-xs tracking-wide">What's buzzing on campus?</p>
            </motion.div>
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setShowSearch(!showSearch)}
                className="p-2.5 rounded-xl bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              >
                <Search className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => refetch()}
                className="p-2.5 rounded-xl bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              >
                <RefreshCw className={`h-5 w-5 transition-transform ${isRefetching ? "animate-spin" : ""}`} />
              </motion.button>
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
                    className="pl-9 pr-8 bg-primary-foreground/90 border-0 text-foreground placeholder:text-muted-foreground rounded-xl"
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
              {[
                { key: "latest" as FeedTab, icon: Flame, label: "Latest" },
                { key: "trending" as FeedTab, icon: TrendingUp, label: "Trending" },
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-primary-foreground text-primary shadow-md"
                      : "bg-primary-foreground/15 text-primary-foreground/80 hover:bg-primary-foreground/25"
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                </motion.button>
              ))}
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
      <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-[11px] text-muted-foreground font-medium">Live feed — updates in real-time</span>
      </div>

      {/* Feed */}
      <main className="max-w-lg mx-auto px-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Skeleton className="h-40 w-full rounded-xl" />
            </motion.div>
          ))
        ) : displayPosts && displayPosts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {displayPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
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
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap className="h-16 w-16 text-primary/20 mx-auto mb-4" />
            </motion.div>
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
