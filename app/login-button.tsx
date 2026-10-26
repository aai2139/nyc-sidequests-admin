"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LoginButton({ nextPath = "/admin" }: { nextPath?: string }) {
  async function login() {
    const supabase = createBrowserSupabaseClient();
    const callbackOrigin = window.location.hostname.endsWith(".vercel.app")
      ? "https://nyc-sidequests-admin.vercel.app"
      : window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${callbackOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
  }
  return <button className="google-button" type="button" onClick={login}><b>G</b> Continue with Google</button>;
}
