const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

// Supabase's password-recovery email links never carry a "?token=" query
// param — they carry either a URL hash fragment or a PKCE "?code=", and
// with detectSessionInUrl: true (see supabaseClient.js), the Supabase
// client parses that automatically and establishes a real recovery
// session before this component even finishes mounting. The previous
// version of this page checked for a "token" param that Supabase never
// sends, so it showed "Invalid reset link" for every real reset email.
export default function ResetPassword() {
  const [checkingLink, setCheckingLink] = useState(true);
  const [validLink, setValidLink] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let settled = false;
    const finish = (isValid) => {
      if (settled) return;
      settled = true;
      setValidLink(isValid);
      setCheckingLink(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") finish(true);
    });

    // Fallback: if the event already fired before this listener attached,
    // or the link used the older hash-based flow, a session will already
    // be present by the time we check.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) finish(true);
    });

    const timeout = setTimeout(() => finish(false), 3000);
    return () => { sub?.subscription?.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await db.auth.resetPassword({ newPassword });
      setDone(true);
      setTimeout(() => { window.location.href = "/login"; }, 1500);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (checkingLink) {
    return (
      <AuthLayout icon={Lock} title="Checking your link…" subtitle="One moment">
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (!validLink) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Invalid or expired link"
        subtitle="This password reset link is no longer valid"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Reset links expire after a while, or may have already been used. Please request a new one.
        </p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout icon={Lock} title="Password updated" subtitle="Redirecting you to log in…">
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle="Enter your new password below"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={8}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={8}
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
