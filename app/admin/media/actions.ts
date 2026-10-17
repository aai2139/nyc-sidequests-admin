"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { generateAdminMedia } from "@/lib/generate-media";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export type MediaActionState = { error?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createMedia(_state: MediaActionState, formData: FormData): Promise<MediaActionState> {
  const user = await requireSuperadmin();
  const neighborhood = text(formData, "neighborhood", 60);
  const budgetMin = Number(formData.get("budgetMin"));
  const budgetMax = Number(formData.get("budgetMax"));
  const partySize = Number(formData.get("partySize"));
  const vibe = text(formData, "vibe", 30);
  const preferences = text(formData, "preferences", 500);
  if (neighborhood.length < 2 || !Number.isInteger(budgetMin) || !Number.isInteger(budgetMax) || budgetMin < 0 || budgetMax > 500 || budgetMin > budgetMax || !Number.isInteger(partySize) || partySize < 1 || partySize > 12 || !["food", "culture", "outdoors", "night-owl", "surprise"].includes(vibe)) return { error: "Check the area, budget, group size, and vibe." };
  try {
    const generated = await generateAdminMedia({ neighborhood, budgetMin, budgetMax, partySize, vibe, preferences });
    const admin = createAdminSupabaseClient();
    const budget = budgetMax <= 25 ? "under-25" : budgetMax <= 50 ? "25-50" : "50-plus";
    const { data, error } = await admin.from("sidequests").insert({
      creator_id: user.id, neighborhood, budget, budget_min_cents: budgetMin * 100, budget_max_cents: budgetMax * 100,
      party_size: partySize, preferences: preferences || null, vibe, title: generated.title, hook: generated.hook,
      stops: generated.stops, budget_note: generated.budgetNote, prompt_text: generated.promptText, model_name: generated.modelName,
      status: "published", content_version: 2,
      cover_image_url: generated.cover?.url ?? null, cover_image_alt: generated.cover?.alt ?? null,
      cover_image_credit: generated.cover?.credit ?? null, cover_image_credit_url: generated.cover?.creditUrl ?? null,
      cover_image_source: generated.cover?.source ?? null, cover_image_key: generated.cover?.key ?? null,
    }).select("id").single();
    if (error || !data) throw error ?? new Error("Insert failed");
    revalidatePath("/admin"); revalidatePath("/admin/media");
    redirect(`/admin/media/${data.id}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error(error);
    return { error: error instanceof Error ? error.message : "Could not generate media." };
  }
}

export async function updateMedia(_state: MediaActionState, formData: FormData): Promise<MediaActionState> {
  await requireSuperadmin();
  const id = text(formData, "id", 40);
  if (!UUID.test(id)) return { error: "Invalid media ID." };
  let stops: unknown;
  try { stops = JSON.parse(String(formData.get("stops") ?? "")); } catch { return { error: "Stops must be valid JSON." }; }
  if (!Array.isArray(stops) || stops.length !== 3) return { error: "Stops must be a JSON array with exactly three items." };
  const values = {
    title: text(formData, "title", 100), hook: text(formData, "hook", 240), neighborhood: text(formData, "neighborhood", 60),
    budget_note: text(formData, "budgetNote", 240), status: text(formData, "status", 20), stops,
    cover_image_url: text(formData, "coverUrl", 1000) || null,
  };
  if (values.title.length < 3 || values.hook.length < 3 || values.neighborhood.length < 2 || values.budget_note.length < 3 || !["published", "hidden"].includes(values.status)) return { error: "Complete all required fields." };
  const { error } = await createAdminSupabaseClient().from("sidequests").update(values).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin"); revalidatePath("/admin/media"); revalidatePath(`/admin/media/${id}`);
  return {};
}

export async function deleteMedia(_state: MediaActionState, formData: FormData): Promise<MediaActionState> {
  await requireSuperadmin();
  const id = text(formData, "id", 40);
  if (!UUID.test(id) || text(formData, "confirmation", 20) !== "DELETE") return { error: "Type DELETE exactly to confirm permanent deletion." };
  const { error } = await createAdminSupabaseClient().from("sidequests").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin"); revalidatePath("/admin/media");
  redirect("/admin/media");
}

function text(formData: FormData, name: string, max: number) { return String(formData.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
