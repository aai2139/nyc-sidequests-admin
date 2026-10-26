import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function getControlPlane() {
  const admin = createAdminSupabaseClient();
  const [chains, steps, mix, terms, examples, providers, models, domains, emails] = await Promise.all([
    admin.from("prompt_chains").select("*").order("created_at"),
    admin.from("prompt_chain_steps").select("*").order("step_order"),
    admin.from("prompt_chain_mix").select("*").order("updated_at", { ascending: false }),
    admin.from("terms").select("*").order("phrase"),
    admin.from("ai_generation_examples").select("*").order("created_at", { ascending: false }),
    admin.from("llm_providers").select("*").order("name"),
    admin.from("llm_models").select("*").order("name"),
    admin.from("allowed_signup_domains").select("*").order("domain"),
    admin.from("whitelisted_emails").select("*").order("email"),
  ]);
  for (const result of [chains, steps, mix, terms, examples, providers, models, domains, emails]) {
    if (result.error) throw result.error;
  }
  return {
    chains: chains.data ?? [], steps: steps.data ?? [], mix: mix.data ?? [],
    terms: terms.data ?? [], examples: examples.data ?? [], providers: providers.data ?? [],
    models: models.data ?? [], domains: domains.data ?? [], emails: emails.data ?? [],
  };
}

export async function getGenerationAudit() {
  const admin = createAdminSupabaseClient();
  const [{ data: requests, error: requestError }, { data: responses, error: responseError }] = await Promise.all([
    admin.from("generation_requests").select("*").order("started_at", { ascending: false }).limit(250),
    admin.from("llm_responses").select("*").order("created_at", { ascending: false }).limit(250),
  ]);
  if (requestError) throw requestError;
  if (responseError) throw responseError;
  return { requests: requests ?? [], responses: responses ?? [] };
}
