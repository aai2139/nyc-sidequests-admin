import Link from "next/link";
import { getDashboardData } from "@/lib/admin-data";

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const maxActivity = Math.max(1, ...data.activity.flatMap((day) => [day.media, day.votes]));
  const maxNeighborhood = Math.max(1, ...data.neighborhoods.map((item) => item.count));
  return (
    <>
      <header className="page-heading"><div><p className="eyebrow">Live database pulse</p><h1>What is New York choosing?</h1><p>Thirty days of generation, moderation, and community taste.</p></div><Link className="primary-button" href="/admin/media/new">Generate media</Link></header>
      <section className="stat-grid" aria-label="Key statistics">
        <Stat label="Users" value={data.stats.users} note={`${data.stats.newUsers7d} joined this week`} tone="lime" />
        <Stat label="AI quests" value={data.stats.media} note={`${data.stats.hidden} currently hidden`} tone="blue" />
        <Stat label="Ratings" value={data.stats.votes} note={`${data.stats.worthItRate}% say worth it`} tone="orange" />
        <Stat label="Generation health" value={`${data.stats.successRate}%`} note={`${data.attempts.length} attempts recorded`} tone="purple" />
      </section>
      <section className="dashboard-grid">
        <article className="panel activity-panel">
          <div className="panel-heading"><div><p className="eyebrow">30-day activity</p><h2>Creation meets opinion</h2></div><div className="legend"><span className="media-key">Quests</span><span className="vote-key">Ratings</span></div></div>
          <div className="activity-chart" aria-label="Daily quests and ratings chart">
            {data.activity.map((day, index) => <div className="activity-day" key={day.key} title={`${day.label}: ${day.media} quests, ${day.votes} ratings`}><div className="activity-bars"><i className="media-bar" style={{ height: `${Math.max(3, day.media / maxActivity * 100)}%` }} /><i className="vote-bar" style={{ height: `${Math.max(3, day.votes / maxActivity * 100)}%` }} /></div>{index % 7 === 0 && <small>{day.label}</small>}</div>)}
          </div>
        </article>
        <article className="panel">
          <p className="eyebrow">Neighborhood heat</p><h2>Where quests cluster</h2>
          <div className="rank-list">{data.neighborhoods.map((item, index) => <div className="rank-item" key={item.label}><b>{index + 1}</b><span>{item.label}</span><i><em style={{ width: `${item.count / maxNeighborhood * 100}%` }} /></i><strong>{item.count}</strong></div>)}</div>
        </article>
        <article className="panel">
          <p className="eyebrow">Community picks</p><h2>Most loved</h2>
          <ol className="media-ranking">{data.loved.map((item) => <li key={item.id}><Link href={`/admin/media/${item.id}`}>{item.title}</Link><span>+{item.worth_it_count} / −{item.skip_it_count}</span></li>)}</ol>
        </article>
        <article className="panel">
          <p className="eyebrow">Split decision</p><h2>Most divisive</h2>
          <ol className="media-ranking">{data.divisive.map((item) => <li key={item.id}><Link href={`/admin/media/${item.id}`}>{item.title}</Link><span>+{item.worth_it_count} / −{item.skip_it_count}</span></li>)}</ol>
        </article>
        <article className="panel distribution-panel">
          <p className="eyebrow">Taste profile</p><h2>Budget and vibe mix</h2>
          <div className="distribution-columns"><Distribution title="Budget" items={data.budgets} total={data.stats.media} /><Distribution title="Vibe" items={data.vibes} total={data.stats.media} /></div>
        </article>
      </section>
    </>
  );
}

function Stat({ label, value, note, tone }: { label: string; value: string | number; note: string; tone: string }) {
  return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Distribution({ title, items, total }: { title: string; items: { label: string; count: number }[]; total: number }) {
  return <div><h3>{title}</h3>{items.map((item) => <div className="distribution-row" key={item.label}><span>{item.label}</span><i><em style={{ width: `${total ? item.count / total * 100 : 0}%` }} /></i><b>{item.count}</b></div>)}</div>;
}
