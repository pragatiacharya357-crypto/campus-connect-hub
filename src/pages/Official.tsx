import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Shield, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const Official = () => {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 gradient-glow px-4 py-4 safe-area-top">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary-foreground" />
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Official Info</h1>
            <p className="text-primary-foreground/60 text-xs">University announcements</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : announcements && announcements.length > 0 ? (
          <AnimatePresence>
            {announcements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, type: "spring" }}
              >
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="gradient-secondary text-secondary-foreground text-[10px] gap-1 border-0">
                        <Shield className="h-3 w-3" /> Official
                      </Badge>
                      <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold mb-1">{a.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Megaphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            </motion.div>
            <p className="font-display font-semibold text-muted-foreground">No announcements yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Official notices will appear here.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Official;
