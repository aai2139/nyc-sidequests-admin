"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export type ControlEntity = "term" | "example" | "provider" | "model" | "domain" | "email" | "mix";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveControlRecord(entity: ControlEntity, formData: FormData) {
  await requireSuperadmin();
  const admin = createAdminSupabaseClient();
  const id = value(formData, "id", 40);
  const active = formData.get("is_active") === "on" || formData.get("is_enabled") === "on";
  let table = "";
  let record: Record<string, unknown> = {};

  if (entity === "term") {
    table = "terms";
    record = { phrase: value(formData, "phrase", 160).toLowerCase(), category: value(formData, "category", 50) || "guidance", notes: value(formData, "notes", 500) || null, is_active: active };
  } else if (entity === "example") {
    table = "ai_generation_examples";
    record = { name: value(formData, "name", 100), input: json(formData, "input"), output: json(formData, "output"), notes: value(formData, "notes", 500) || null, is_active: active };
  } else if (entity === "provider") {
    table = "llm_providers";
    record = { slug: value(formData, "slug", 60).toLowerCase(), name: value(formData, "name", 100), base_url: value(formData, "base_url", 500) || null, credential_env_var: value(formData, "credential_env_var", 100), is_enabled: active };
  } else if (entity === "model") {
    table = "llm_models";
    record = { provider_id: value(formData, "provider_id", 40), model_id: value(formData, "model_id", 120), name: value(formData, "name", 100), description: value(formData, "description", 500) || null, is_enabled: active, is_default: formData.get("is_default") === "on" };
  } else if (entity === "domain") {
    table = "allowed_signup_domains";
    record = { domain: value(formData, "domain", 255).toLowerCase().replace(/^@/, ""), is_enabled: active };
  } else if (entity === "email") {
    table = "whitelisted_emails";
    record = { email: value(formData, "email", 320).toLowerCase(), is_enabled: active };
  } else {
    table = "prompt_chain_mix";
    record = { model_id: value(formData, "model_id", 40) || null, weight: Math.min(100, Math.max(0, Number(formData.get("weight")))), is_enabled: active, updated_at: new Date().toISOString() };
  }

  if (entity === "model" && record.is_default) await admin.from("llm_models").update({ is_default: false }).neq("id", id || "00000000-0000-0000-0000-000000000000");
  const query = id && UUID.test(id) ? admin.from(table).update(record).eq("id", id) : admin.from(table).insert(record);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/admin/control");
}

export async function deleteControlRecord(entity: Exclude<ControlEntity, "mix">, formData: FormData) {
  await requireSuperadmin();
  const id = value(formData, "id", 40);
  if (!UUID.test(id)) throw new Error("Invalid record ID.");
  const tables: Record<Exclude<ControlEntity, "mix">, string> = {
    term: "terms", example: "ai_generation_examples", provider: "llm_providers",
    model: "llm_models", domain: "allowed_signup_domains", email: "whitelisted_emails",
  };
  const { error } = await createAdminSupabaseClient().from(tables[entity]).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/control");
}

function value(formData: FormData, name: string, max: number) { return String(formData.get(name) ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
function json(formData: FormData, name: string) { const raw = String(formData.get(name) ?? "{}"); try { return JSON.parse(raw); } catch { throw new Error(`${name} must be valid JSON.`); } }
