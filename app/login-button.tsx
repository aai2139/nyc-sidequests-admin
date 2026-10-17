"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LoginButton({ nextPath = "/admin" }: { nextPath?: string }) {
  async function login() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
  }
  return <button className="google-button" type="button" onClick={login}><b>G</b> Continue with Google</button>;
}
