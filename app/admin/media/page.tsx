import Link from "next/link";
import { getMedia } from "@/lib/admin-data";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const { search = "", status = "all" } = await searchParams;
  const safeStatus = status === "published" || status === "hidden" ? status : "all";
  const media = await getMedia(search, safeStatus);
  return (
    <>
      <header className="page-heading"><div><p className="eyebrow">Full content control</p><h1>AI-generated media</h1><p>Create, inspect, edit, hide, publish, and permanently delete generated quests.</p></div><Link className="primary-button" href="/admin/media/new">Generate new</Link></header>
      <form className="toolbar"><input name="search" defaultValue={search} placeholder="Search title or neighborhood" /><select name="status" defaultValue={safeStatus}><option value="all">All statuses</option><option value="published">Published</option><option value="hidden">Hidden</option></select><button className="secondary-button">Filter</button>{(search || safeStatus !== "all") && <Link href="/admin/media">Clear</Link>}</form>
      <section className="media-grid">{media.map((item) => <article className="media-card" key={item.id}>{item.cover_image_url ? <div className="media-cover" style={{ backgroundImage: `linear-gradient(180deg, transparent, rgba(16,24,18,.76)), url("${item.cover_image_url.replaceAll('"', "%22")}")` }}><small>{item.cover_image_credit || "Attributed cover"}</small></div> : <div className="media-cover media-cover-empty"><span>SQ</span></div>}<div className="media-card-body"><div className="media-meta"><span className={`status ${item.status === "published" ? "status-live" : "status-hidden"}`}>{item.status}</span><time>{formatDate(item.created_at)}</time></div><h2><Link href={`/admin/media/${item.id}`}>{item.title}</Link></h2><p>{item.hook}</p><div className="media-card-footer"><span>{item.neighborhood}</span><b>+{item.worth_it_count} / −{item.skip_it_count}</b></div></div></article>)}</section>
      {!media.length && <div className="empty-panel"><h2>No media matches.</h2><p>Clear the filters or generate a new quest.</p></div>}
    </>
  );
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
