import { redirect } from "next/navigation";
import LoginButton from "@/app/login-button";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/admin";
  const session = await getAdminSession();
  if (session.user && session.isSuperadmin) redirect(nextPath);
  if (session.user) redirect("/unauthorized");
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-art" aria-hidden="true"><span>1</span><span>2</span><span>3</span><i /></div>
        <div className="auth-copy">
          <p className="eyebrow">Restricted operations</p>
          <h1>Sidequests control room.</h1>
          <p>Sign in with the approved Google account to review activity, manage generated itineraries, and inspect community ratings.</p>
          <LoginButton nextPath={nextPath} />
          <small>Google sign-in is followed by a database-backed superadmin check.</small>
        </div>
      </section>
    </main>
  );
}
