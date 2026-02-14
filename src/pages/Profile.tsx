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
import { LogOut, Save, User, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [anonymousDefault, setAnonymousDefault] = useState(profile?.anonymous_default || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          anonymous_default: anonymousDefault,
        })
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
      <header className="sticky top-0 z-40 gradient-primary px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <User className="h-6 w-6 text-primary-foreground" />
          <div>
            <h1 className="text-2xl font-bold font-display text-primary-foreground">Profile</h1>
            <p className="text-primary-foreground/70 text-xs">Manage your settings</p>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 mt-4 space-y-4"
      >
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                {(profile?.display_name || profile?.username || "?").charAt(0).toUpperCase()}
              </div>
              {profile?.display_name || profile?.username}
            </CardTitle>
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
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
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

        {/* Privacy info */}
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
