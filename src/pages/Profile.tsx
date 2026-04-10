import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Save, Shield, BarChart3, MessageCircle, ThumbsUp, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/hooks/useTheme";

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [anonymousDefault, setAnonymousDefault] = useState(profile?.anonymous_default || false);
  const [saving, setSaving] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user) return { posts: 0, comments: 0, votes: 0 };
      const [postsRes, commentsRes, votesRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("author_id", user.id),
        supabase.from("votes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      return {
        posts: postsRes.count || 0,
        comments: commentsRes.count || 0,
        votes: votesRes.count || 0,
      };
    },
    enabled: !!user,
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName || null, anonymous_default: anonymousDefault })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const statItems = [
    { icon: BarChart3, value: stats?.posts || 0, label: "Posts", color: "text-primary" },
    { icon: MessageCircle, value: stats?.comments || 0, label: "Comments", color: "text-accent" },
    { icon: ThumbsUp, value: stats?.votes || 0, label: "Votes", color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 gradient-primary px-4 py-6 pb-14 safe-area-top">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-18 h-18 rounded-2xl gradient-glow flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-xl"
            style={{ width: 72, height: 72 }}
          >
            {(profile?.display_name || profile?.username || "?").charAt(0).toUpperCase()}
          </motion.div>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-display text-primary-foreground">
              {profile?.display_name || profile?.username}
            </h1>
            <p className="text-primary-foreground/60 text-xs">@{profile?.username}</p>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 -mt-10 space-y-4"
      >
        {/* Stats */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-5">
            <div className="grid grid-cols-3 gap-4">
              {statItems.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className={`h-5 w-5 mx-auto mb-1.5 ${stat.color}`} />
                  <p className="text-2xl font-bold font-display">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Username</Label>
              <Input value={profile?.username || ""} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs text-muted-foreground">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
            </div>

            {/* Theme toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                <Label className="text-sm font-medium">Dark Mode</Label>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <Label htmlFor="anonDefault" className="text-sm font-medium">Post anonymously by default</Label>
              <Switch id="anonDefault" checked={anonymousDefault} onCheckedChange={setAnonymousDefault} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground h-11">
              {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-primary/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm">Data Privacy</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your data is encrypted and stored securely. ID card photos are only accessible to administrators.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={handleSignOut} className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 h-11">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </motion.main>
    </div>
  );
};

export default Profile;
