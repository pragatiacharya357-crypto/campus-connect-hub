import React from "react";
import { motion } from "framer-motion";
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
      <header className="sticky top-0 z-40 bg-gradient-to-r from-red-500 to-orange-500 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-white" />
          <div>
            <h1 className="text-2xl font-bold font-display text-white">Official Info</h1>
            <p className="text-white/70 text-xs">University announcements</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
        ) : announcements && announcements.length > 0 ? (
          announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-l-4 border-l-secondary shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="gradient-secondary text-secondary-foreground text-xs">
                      <Shield className="h-3 w-3 mr-1" /> Official
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="font-display font-semibold">No announcements yet</p>
            <p className="text-sm mt-1">Official notices will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Official;
