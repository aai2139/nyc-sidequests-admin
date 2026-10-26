import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") || "/admin";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/admin";
  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      } },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user ? await createAdminSupabaseClient()
        .from("profiles")
        .select("is_superadmin")
        .eq("id", user.id)
        .maybeSingle() : { data: null };
      if (!user || profile?.is_superadmin !== true) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/unauthorized`);
      }
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
