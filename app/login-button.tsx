"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LoginButton({ nextPath = "/admin" }: { nextPath?: string }) {
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function login() {
    setIsStarting(true);
    setErrorMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    if (error) {
      setErrorMessage("Google sign-in could not start. Please try again.");
      setIsStarting(false);
    }
  }

  return (
    <div className="login-action">
      <button className="google-button" type="button" onClick={login} disabled={isStarting}>
        <b aria-hidden="true">G</b>
        {isStarting ? "Opening Google…" : "Continue with Google"}
        <span aria-hidden="true">→</span>
      </button>
      {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
    </div>
  );
}
