import Link from "next/link";
import { notFound } from "next/navigation";
import EditForm from "./edit-form";
import { getMediaItem } from "@/lib/admin-data";

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getMediaItem(id);
  if (!item) notFound();
  return <><header className="page-heading"><div><Link className="back-link" href="/admin/media">← All AI media</Link><p className="eyebrow">Edit generated media</p><h1>{item.title}</h1><p>Created with {item.model_name} on {formatDate(item.created_at)}.</p></div><span className={`status ${item.status === "published" ? "status-live" : "status-hidden"}`}>{item.status}</span></header><section className="form-panel"><EditForm item={item} /></section></>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value)); }
