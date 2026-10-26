import { getGenerationAudit } from "@/lib/control-plane";

export const dynamic = "force-dynamic";
const format = (value: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function GenerationsPage() {
  const { requests, responses } = await getGenerationAudit();
  const responseByRequest = new Map(responses.map((item) => [item.generation_request_id, item]));
  return <>
    <header className="page-heading"><div><p className="eyebrow">Generation observability</p><h1>Requests and responses</h1><p>Read-only audit records for model inputs, outcomes, latency, and returned content.</p></div><span className="count-badge">{requests.length} requests</span></header>
    <section className="generation-audit-list">{requests.map((request) => { const response = responseByRequest.get(request.id); return <details className="audit-record" key={request.id}><summary><span className={`status ${request.status === "succeeded" ? "status-live" : request.status === "failed" ? "status-hidden" : ""}`}>{request.status}</span><b>{request.request_input?.neighborhood ?? "Unknown area"}</b><time>{format(request.started_at)}</time><span>{request.selected_stop_count ? `${request.selected_stop_count} stops` : "—"}</span></summary><div className="audit-body"><div><p className="eyebrow">Request input</p><pre>{JSON.stringify(request.request_input, null, 2)}</pre></div><div><p className="eyebrow">LLM response</p>{request.error_message && <p className="form-error">{request.error_message}</p>}{response ? <><small>{response.latency_ms ? `${response.latency_ms} ms` : "Latency unavailable"}</small><pre>{JSON.stringify(response.parsed_output, null, 2)}</pre></> : <p>No stored response.</p>}</div></div></details>; })}</section>
    {!requests.length && <div className="empty-panel"><h2>No generation requests yet.</h2><p>New public generations will appear here after the control-plane migration is live.</p></div>}
  </>;
}
