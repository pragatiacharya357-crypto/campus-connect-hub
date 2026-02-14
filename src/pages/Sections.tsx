import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bus, UtensilsCrossed, Coffee, PartyPopper, Laugh, BookOpen, MessageSquare, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "@/components/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { Skeleton } from "@/components/ui/skeleton";

const SECTIONS = [
  { tag: "bus", label: "Bus/Transport", icon: Bus, color: "from-blue-500 to-blue-600", emoji: "🚌" },
  { tag: "mess", label: "Mess", icon: UtensilsCrossed, color: "from-orange-500 to-orange-600", emoji: "🍽️" },
  { tag: "canteen", label: "Canteen", icon: Coffee, color: "from-amber-500 to-amber-600", emoji: "☕" },
  { tag: "fest", label: "Fest/Events", icon: PartyPopper, color: "from-pink-500 to-pink-600", emoji: "🎉" },
  { tag: "memes", label: "Memes/Fun", icon: Laugh, color: "from-green-500 to-green-600", emoji: "😂" },
  { tag: "study", label: "Study/Academic", icon: BookOpen, color: "from-indigo-500 to-indigo-600", emoji: "📚" },
  { tag: "general", label: "General", icon: MessageSquare, color: "from-gray-500 to-gray-600", emoji: "💬" },
];

const Sections = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { data: posts, isLoading } = usePosts(selectedTag || undefined);

  if (selectedTag) {
    const section = SECTIONS.find((s) => s.tag === selectedTag);
    return (
      <div className="min-h-screen pb-20">
        <header className={`sticky top-0 z-40 bg-gradient-to-r ${section?.color} px-4 py-4`}>
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => setSelectedTag(null)} className="text-white p-1">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-2xl">{section?.emoji}</span>
            <h1 className="text-xl font-bold font-display text-white">{section?.label}</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} {...post} authorName={post.authorName} isAnonymous={post.is_anonymous} createdAt={post.created_at} userVote={post.userVote} />
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-4xl mb-2">{section?.emoji}</p>
              <p className="font-display font-semibold">No posts in {section?.label} yet</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 gradient-accent px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold font-display text-accent-foreground">Sections</h1>
          <p className="text-accent-foreground/70 text-xs">Browse by topic</p>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 mt-4 grid grid-cols-2 gap-3">
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.tag}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-0 overflow-hidden"
              onClick={() => setSelectedTag(section.tag)}
            >
              <CardContent className={`p-4 bg-gradient-to-br ${section.color} text-white`}>
                <span className="text-3xl mb-2 block">{section.emoji}</span>
                <p className="font-display font-semibold text-sm">{section.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </main>
    </div>
  );
};

export default Sections;
