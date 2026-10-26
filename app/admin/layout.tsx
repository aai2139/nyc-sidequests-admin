import Link from "next/link";
import LogoutButton from "@/app/logout-button";
import { requireSuperadmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperadmin();
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <Link className="admin-brand" href="/admin"><span>SQ</span><strong>Control<br />Room</strong></Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/media">AI media</Link>
          <Link href="/admin/ratings">Ratings</Link>
          <Link href="/admin/generations">Generations</Link>
          <Link href="/admin/control">AI controls</Link>
        </nav>
        <div className="admin-identity"><small>Signed in as</small><b>{user.email}</b><LogoutButton /></div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
