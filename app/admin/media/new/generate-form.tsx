"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createMedia, type MediaActionState } from "@/app/admin/media/actions";

const initial: MediaActionState = {};

export default function GenerateForm() {
  const [state, action, pending] = useActionState(createMedia, initial);
  return (
    <form className="editor-form" action={action}>
      <div className="form-grid">
        <label className="span-two"><span>Neighborhood or area</span><input name="neighborhood" required minLength={2} maxLength={60} placeholder="Jackson Heights" /></label>
        <label><span>Minimum per person</span><input name="budgetMin" type="number" min="0" max="500" defaultValue="15" required /></label>
        <label><span>Maximum per person</span><input name="budgetMax" type="number" min="0" max="500" defaultValue="40" required /></label>
        <label><span>Group size</span><input name="partySize" type="number" min="1" max="12" defaultValue="2" required /></label>
        <label><span>Vibe</span><select name="vibe" defaultValue="surprise"><option value="food">Food crawl</option><option value="culture">Culture fix</option><option value="outdoors">Outside energy</option><option value="night-owl">Night owl</option><option value="surprise">Surprise me</option></select></label>
        <label className="span-two"><span>Creative direction</span><textarea name="preferences" maxLength={500} placeholder="Optional occasion, accessibility need, or must-do" /></label>
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <div className="button-row"><button className="primary-button" disabled={pending}>{pending ? "Generating and mapping…" : "Generate and publish"}</button><Link className="secondary-button" href="/admin/media">Cancel</Link></div>
    </form>
  );
}
