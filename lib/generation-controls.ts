import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export type GenerationControls = {
  chainId: string | null;
  modelRecordId: string | null;
  modelName?: string;
  promptSteps: string[];
  terms: string[];
  examples: Array<{ input: unknown; output: unknown }>;
};

export async function loadGenerationControls(): Promise<GenerationControls> {
  const admin = createAdminSupabaseClient();
  const { data: mix, error } = await admin.from("prompt_chain_mix").select("chain_id, model_id, weight").eq("is_enabled", true).gt("weight", 0);
  if (error || !mix?.length) return empty();
  const total = mix.reduce((sum, item) => sum + item.weight, 0);
  let ticket = Math.random() * total;
  const selected = mix.find((item) => (ticket -= item.weight) <= 0) ?? mix[0];
  const [{ data: model }, { data: steps }, { data: terms }, { data: examples }] = await Promise.all([
    admin.from("llm_models").select("id, model_id, is_enabled").eq("id", selected.model_id).maybeSingle(),
    admin.from("prompt_chain_steps").select("template").eq("chain_id", selected.chain_id).order("step_order"),
    admin.from("terms").select("phrase").eq("is_active", true).order("phrase").limit(50),
    admin.from("ai_generation_examples").select("input, output").eq("is_active", true).order("created_at", { ascending: false }).limit(3),
  ]);
  return { chainId: selected.chain_id, modelRecordId: model?.id ?? null, modelName: model?.is_enabled ? model.model_id : undefined, promptSteps: (steps ?? []).map((item) => item.template), terms: (terms ?? []).map((item) => item.phrase), examples: examples ?? [] };
}

function empty(): GenerationControls { return { chainId: null, modelRecordId: null, promptSteps: [], terms: [], examples: [] }; }
