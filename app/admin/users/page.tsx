import Link from "next/link";
import { getAdminUsers } from "@/lib/admin-data";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search = "" } = await searchParams;
  const users = await getAdminUsers();
  const needle = search.toLowerCase();
  const filtered = users.filter((user) => !needle || `${user.name} ${user.email}`.toLowerCase().includes(needle));
  return (
    <>
      <header className="page-heading"><div><p className="eyebrow">Read-only directory</p><h1>Users and profiles</h1><p>Authentication records joined with Sidequests profile and activity data.</p></div><span className="count-badge">{filtered.length} shown</span></header>
      <form className="toolbar"><input name="search" defaultValue={search} placeholder="Search name or email" /><button className="secondary-button">Search</button>{search && <Link href="/admin/users">Clear</Link>}</form>
      <section className="table-card"><table><thead><tr><th>User</th><th>Access</th><th>Joined</th><th>Last sign-in</th><th>Quests</th><th>Ratings</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><div className="user-cell"><span>{initials(user.name)}</span><div><b>{user.name}</b><small>{user.email}</small></div></div></td><td>{user.isSuperadmin ? <span className="status status-admin">Superadmin</span> : <span className="status">Member</span>}</td><td>{formatDate(user.createdAt)}</td><td>{user.lastSignInAt ? formatDate(user.lastSignInAt) : "Never"}</td><td>{user.mediaCount}</td><td>{user.voteCount}</td></tr>)}</tbody></table></section>
    </>
  );
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
