"use client";

import { useActionState } from "react";
import { deleteMedia, updateMedia, type MediaActionState } from "@/app/admin/media/actions";
import type { MediaRow } from "@/lib/admin-data";

const initial: MediaActionState = {};

export default function EditForm({ item }: { item: MediaRow }) {
  const [updateState, updateAction, updating] = useActionState(updateMedia, initial);
  const [deleteState, deleteAction, deleting] = useActionState(deleteMedia, initial);
  return (
    <div className="editor-stack">
      <form className="editor-form" action={updateAction}>
        <input type="hidden" name="id" value={item.id} />
        <div className="form-grid">
          <label className="span-two"><span>Title</span><input name="title" defaultValue={item.title} minLength={3} maxLength={100} required /></label>
          <label className="span-two"><span>Hook</span><textarea name="hook" defaultValue={item.hook} maxLength={240} required /></label>
          <label><span>Neighborhood</span><input name="neighborhood" defaultValue={item.neighborhood} required /></label>
          <label><span>Status</span><select name="status" defaultValue={item.status}><option value="published">Published</option><option value="hidden">Hidden</option></select></label>
          <label className="span-two"><span>Budget note</span><textarea name="budgetNote" defaultValue={item.budget_note} maxLength={240} required /></label>
          <label className="span-two"><span>Cover image URL</span><input name="coverUrl" type="url" defaultValue={item.cover_image_url ?? ""} /></label>
          <label className="span-two"><span>Stops JSON</span><textarea className="code-field" name="stops" defaultValue={JSON.stringify(item.stops, null, 2)} required /></label>
        </div>
        {updateState.error ? <p className="form-error" role="alert">{updateState.error}</p> : updateState && !updating && <p className="form-success">Changes saved.</p>}
        <button className="primary-button" disabled={updating}>{updating ? "Saving…" : "Save changes"}</button>
      </form>
      <form className="danger-zone" action={deleteAction}>
        <input type="hidden" name="id" value={item.id} />
        <div><p className="eyebrow">Danger zone</p><h2>Permanently delete this quest</h2><p>This removes the media and its related ratings. This cannot be undone.</p></div>
        <label><span>Type DELETE to confirm</span><input name="confirmation" autoComplete="off" /></label>
        {deleteState.error && <p className="form-error" role="alert">{deleteState.error}</p>}
        <button className="danger-button" disabled={deleting}>{deleting ? "Deleting…" : "Delete permanently"}</button>
      </form>
    </div>
  );
}
