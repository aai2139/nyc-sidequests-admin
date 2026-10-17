"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await createBrowserSupabaseClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return <button className="quiet-button" type="button" onClick={logout}>Sign out</button>;
}
