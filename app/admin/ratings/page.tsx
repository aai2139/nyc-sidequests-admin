import Link from "next/link";
import { getRatings } from "@/lib/admin-data";

export default async function RatingsPage({ searchParams }: { searchParams: Promise<{ value?: string }> }) {
  const { value = "all" } = await searchParams;
  const ratings = await getRatings(value === "1" || value === "-1" ? value : "all");
  return (
    <>
      <header className="page-heading"><div><p className="eyebrow">Read-only signal</p><h1>Upvotes and downvotes</h1><p>Every community rating, connected to its voter and generated quest.</p></div><span className="count-badge">{ratings.length} ratings</span></header>
      <form className="toolbar"><select name="value" defaultValue={value}><option value="all">All ratings</option><option value="1">Worth it</option><option value="-1">Skip it</option></select><button className="secondary-button">Filter</button></form>
      <section className="table-card"><table><thead><tr><th>Rating</th><th>Quest</th><th>User</th><th>Neighborhood</th><th>Submitted</th></tr></thead><tbody>{ratings.map((rating) => <tr key={`${rating.sidequest_id}:${rating.user_id}`}><td><span className={`rating-chip ${rating.value === 1 ? "positive" : "negative"}`}>{rating.value === 1 ? "Worth it" : "Skip it"}</span></td><td>{rating.media ? <Link className="table-link" href={`/admin/media/${rating.sidequest_id}`}>{rating.media.title}</Link> : "Deleted quest"}</td><td><b>{rating.user?.name ?? "Unknown"}</b><small className="table-subline">{rating.user?.email}</small></td><td>{rating.media?.neighborhood ?? "—"}</td><td>{formatDate(rating.created_at)}</td></tr>)}</tbody></table></section>
    </>
  );
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
