import Link from "next/link";
import { getRatings } from "@/lib/admin-data";
import RatingsFilters from "@/app/admin/ratings/ratings-filters";

type RatingsSearchParams = { value?: string; user?: string; neighborhood?: string };

export default async function RatingsPage({ searchParams }: { searchParams: Promise<RatingsSearchParams> }) {
  const params = await searchParams;
  const allRatings = await getRatings();
  const userOptions = [...new Map(allRatings.filter((rating) => rating.user).map((rating) => [rating.user_id, { value: rating.user_id, label: rating.user!.name }])).values()].sort((a, b) => a.label.localeCompare(b.label));
  const neighborhoodOptions = [...new Set(allRatings.map((rating) => rating.media?.neighborhood).filter((neighborhood): neighborhood is string => Boolean(neighborhood)))].sort((a, b) => a.localeCompare(b)).map((neighborhood) => ({ value: neighborhood, label: neighborhood }));
  const value = params.value === "1" || params.value === "-1" ? params.value : "all";
  const user = userOptions.some((option) => option.value === params.user) ? params.user! : "all";
  const neighborhood = neighborhoodOptions.some((option) => option.value === params.neighborhood) ? params.neighborhood! : "all";
  const ratings = allRatings.filter((rating) => (value === "all" || String(rating.value) === value) && (user === "all" || rating.user_id === user) && (neighborhood === "all" || rating.media?.neighborhood === neighborhood));
  return (
    <>
      <header className="page-heading"><div><p className="eyebrow">Read-only signal</p><h1>Upvotes and downvotes</h1><p>Every community rating, connected to its voter and generated quest.</p></div><span className="count-badge">{ratings.length} ratings</span></header>
      <RatingsFilters value={value} user={user} neighborhood={neighborhood} users={userOptions} neighborhoods={neighborhoodOptions} />
      {ratings.length ? <section className="table-card"><table><thead><tr><th>Rating</th><th>Quest</th><th>User</th><th>Neighborhood</th><th>Submitted</th></tr></thead><tbody>{ratings.map((rating) => <tr key={`${rating.sidequest_id}:${rating.user_id}`}><td><span className={`rating-chip ${rating.value === 1 ? "positive" : "negative"}`}>{rating.value === 1 ? "Worth it" : "Skip it"}</span></td><td>{rating.media ? <Link className="table-link" href={`/admin/media/${rating.sidequest_id}`}>{rating.media.title}</Link> : "Deleted quest"}</td><td><b>{rating.user?.name ?? "Unknown"}</b><small className="table-subline">{rating.user?.email}</small></td><td>{rating.media?.neighborhood ?? "—"}</td><td>{formatDate(rating.created_at)}</td></tr>)}</tbody></table></section> : <section className="empty-panel"><h2>No ratings match these filters.</h2><p>Choose a different rating, user, or neighborhood.</p></section>}
    </>
  );
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
