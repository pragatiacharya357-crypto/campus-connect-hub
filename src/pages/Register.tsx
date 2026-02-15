import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Upload, UserPlus, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

const STEPS = ["Email", "ID Card Upload", "Profile Setup"];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [anonymousDefault, setAnonymousDefault] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    toast.success("Email noted! Continue to upload your ID card.");
    setStep(1);
  };

  const handleIdUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile) {
      toast.error("Please upload your university ID card photo");
      return;
    }
    if (!idNumber.trim()) {
      toast.error("Please enter your ID number");
      return;
    }
    setStep(2);
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) throw signUpError;

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("User creation failed");

      if (idFile) {
        const filePath = `${userId}/${Date.now()}-${idFile.name}`;
        const { error: uploadError } = await supabase.storage.from("id-cards").upload(filePath, idFile);
        if (uploadError) console.error("ID upload error:", uploadError);
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username,
          display_name: displayName || null,
          hashed_id_number: idNumber,
          anonymous_default: anonymousDefault,
        })
        .eq("id", userId);
      if (profileError) throw profileError;

      toast.success("Account created! You're all set 🎉");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-display text-primary-foreground">UniBuzz</h1>
          <p className="text-primary-foreground/80 mt-1">Your Campus. Your Voice.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i <= step ? "bg-primary-foreground text-primary" : "bg-primary-foreground/30 text-primary-foreground/60"
              }`}>
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-primary-foreground" : "bg-primary-foreground/30"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">{STEPS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && "Enter your email to get started"}
              {step === 1 && "Upload your university ID card for verification"}
              {step === 2 && "Create your profile to join the buzz"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.form key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign up with Google
                  </Button>
                </motion.form>
              )}

              {step === 1 && (
                <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleIdUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label>ID Card Photo</Label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/60 transition-colors bg-muted/50">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">{idFile ? idFile.name : "Click to upload ID card"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input id="idNumber" placeholder="Enter your university ID number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <Button type="submit" className="flex-1 gradient-primary text-primary-foreground">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleProfileSetup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Choose a unique username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name (optional)</Label>
                    <Input id="displayName" placeholder="How you want to appear" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="anonymous" className="text-sm">Post anonymously by default</Label>
                    <Switch id="anonymous" checked={anonymousDefault} onCheckedChange={setAnonymousDefault} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                    <Button type="submit" disabled={loading} className="flex-1 gradient-primary text-primary-foreground">
                      {loading ? "Creating..." : <>Create Account <UserPlus className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
