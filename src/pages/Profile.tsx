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
import { LogOut, Save, User, Shield, BarChart3, MessageCircle, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [anonymousDefault, setAnonymousDefault] = useState(profile?.anonymous_default || false);
  const [saving, setSaving] = useState(false);

  // User stats
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

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 gradient-primary px-4 py-6 pb-12">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-accent-foreground text-2xl font-bold border-4 border-primary-foreground/20">
            {(profile?.display_name || profile?.username || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">
              {profile?.display_name || profile?.username}
            </h1>
            <p className="text-primary-foreground/70 text-xs">@{profile?.username}</p>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 -mt-8 space-y-4"
      >
        {/* Stats card */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold font-display">{stats?.posts || 0}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-accent mb-1">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold font-display">{stats?.comments || 0}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-secondary mb-1">
                  <ThumbsUp className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold font-display">{stats?.votes || 0}</p>
                <p className="text-xs text-muted-foreground">Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={profile?.username || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label htmlFor="anonDefault" className="text-sm">Post anonymously by default</Label>
              <Switch id="anonDefault" checked={anonymousDefault} onCheckedChange={setAnonymousDefault} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
              {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <div>
                <p className="font-display font-semibold text-sm text-foreground">Data Privacy</p>
                <p className="text-xs">Your data is encrypted and stored securely. ID card photos are only accessible to administrators.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={handleSignOut} className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </motion.main>
    </div>
  );
};

export default Profile;
