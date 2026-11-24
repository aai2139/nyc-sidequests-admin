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
        <header className="auth-header">
          <div className="auth-brand"><span>SQ</span><strong>Sidequests<br />Control Room</strong></div>
          <span className="auth-access">Admin access</span>
        </header>
        <div className="auth-copy">
          <p className="eyebrow">Private workspace</p>
          <h1>Keep the city&apos;s sidequests on course.</h1>
          <p>Review activity, manage generated itineraries, and understand what the community rates worth the detour.</p>
          <LoginButton nextPath={nextPath} />
          <p className="auth-note"><i aria-hidden="true" /> Access is limited to approved administrators.</p>
        </div>
        <aside className="auth-capabilities" aria-label="Control room capabilities">
          <p className="eyebrow">Inside the room</p>
          <ol>
            <li><b>01</b><span><strong>Monitor</strong><small>Users, ratings, and generation activity</small></span></li>
            <li><b>02</b><span><strong>Curate</strong><small>Generated quests and published media</small></span></li>
            <li><b>03</b><span><strong>Control</strong><small>Prompts, models, access, and quality</small></span></li>
          </ol>
        </aside>
      </section>
    </main>
  );
}
