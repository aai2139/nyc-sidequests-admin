import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export type MediaRow = {
  id: string;
  creator_id: string;
  neighborhood: string;
  budget: "under-25" | "25-50" | "50-plus";
  budget_min_cents: number | null;
  budget_max_cents: number | null;
  party_size: number;
  preferences: string | null;
  vibe: "food" | "culture" | "outdoors" | "night-owl" | "surprise";
  title: string;
  hook: string;
  stops: unknown;
  budget_note: string;
  status: "published" | "hidden";
  worth_it_count: number;
  skip_it_count: number;
  cover_image_url: string | null;
  cover_image_credit: string | null;
  created_at: string;
  model_name: string;
};

export async function getAdminUsers() {
  const admin = createAdminSupabaseClient();
  const [{ data: authData, error: authError }, { data: profiles, error: profileError }, { data: media }, { data: votes }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id, first_name, last_name, avatar_url, is_superadmin"),
    admin.from("sidequests").select("creator_id"),
    admin.from("votes").select("user_id"),
  ]);
  if (authError) throw authError;
  if (profileError) throw profileError;
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const mediaCounts = countBy((media ?? []).map((item) => item.creator_id));
  const voteCounts = countBy((votes ?? []).map((item) => item.user_id));
  return authData.users.map((user) => {
    const profile = profileById.get(user.id);
    const metadata = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? "No email",
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || metadata.full_name || metadata.name || "Unnamed user",
      avatarUrl: profile?.avatar_url || metadata.avatar_url || null,
      isSuperadmin: profile?.is_superadmin === true,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      mediaCount: mediaCounts.get(user.id) ?? 0,
      voteCount: voteCounts.get(user.id) ?? 0,
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getDashboardData() {
  const admin = createAdminSupabaseClient();
  const [users, mediaResult, votesResult, attemptsResult] = await Promise.all([
    getAdminUsers(),
    admin.from("sidequests").select("id, neighborhood, budget, vibe, title, status, worth_it_count, skip_it_count, created_at"),
    admin.from("votes").select("value, created_at"),
    admin.from("generation_attempts").select("succeeded, created_at"),
  ]);
  if (mediaResult.error) throw mediaResult.error;
  if (votesResult.error) throw votesResult.error;
  if (attemptsResult.error) throw attemptsResult.error;
  const media = mediaResult.data ?? [];
  const votes = votesResult.data ?? [];
  const attempts = attemptsResult.data ?? [];
  const successes = attempts.filter((item) => item.succeeded).length;
  const worthIt = votes.filter((item) => item.value === 1).length;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activity = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(cutoff + index * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
      media: media.filter((item) => item.created_at.slice(0, 10) === key).length,
      votes: votes.filter((item) => item.created_at.slice(0, 10) === key).length,
    };
  });
  return {
    users,
    media,
    votes,
    attempts,
    activity,
    stats: {
      users: users.length,
      newUsers7d: users.filter((user) => Date.now() - new Date(user.createdAt).getTime() < 7 * 86400000).length,
      media: media.length,
      votes: votes.length,
      successRate: attempts.length ? Math.round(successes / attempts.length * 100) : 0,
      worthItRate: votes.length ? Math.round(worthIt / votes.length * 100) : 0,
      hidden: media.filter((item) => item.status === "hidden").length,
    },
    neighborhoods: rankCounts(media.map((item) => item.neighborhood)).slice(0, 6),
    budgets: rankCounts(media.map((item) => item.budget)),
    vibes: rankCounts(media.map((item) => item.vibe)),
    loved: [...media].sort((a, b) => (b.worth_it_count - b.skip_it_count) - (a.worth_it_count - a.skip_it_count)).slice(0, 5),
    divisive: [...media].sort((a, b) => {
      const aTotal = a.worth_it_count + a.skip_it_count;
      const bTotal = b.worth_it_count + b.skip_it_count;
      const aSplit = aTotal ? 1 - Math.abs(a.worth_it_count - a.skip_it_count) / aTotal : 0;
      const bSplit = bTotal ? 1 - Math.abs(b.worth_it_count - b.skip_it_count) / bTotal : 0;
      return bSplit - aSplit || bTotal - aTotal;
    }).slice(0, 5),
  };
}

export async function getMedia(query = "", status = "all") {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("sidequests").select("*").order("created_at", { ascending: false }).limit(250);
  if (error) throw error;
  const needle = query.toLowerCase();
  return ((data ?? []) as MediaRow[]).filter((item) =>
    (status === "all" || item.status === status) &&
    (!needle || [item.title, item.neighborhood, item.hook].some((value) => value.toLowerCase().includes(needle))));
}

export async function getMediaItem(id: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("sidequests").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as MediaRow | null;
}

export async function getRatings(value = "all") {
  const admin = createAdminSupabaseClient();
  const [{ data: votes, error }, { data: media }, users] = await Promise.all([
    admin.from("votes").select("sidequest_id, user_id, value, created_at, updated_at").order("created_at", { ascending: false }).limit(500),
    admin.from("sidequests").select("id, title, neighborhood"),
    getAdminUsers(),
  ]);
  if (error) throw error;
  const mediaById = new Map((media ?? []).map((item) => [item.id, item]));
  const userById = new Map(users.map((user) => [user.id, user]));
  return (votes ?? []).filter((vote) => value === "all" || String(vote.value) === value).map((vote) => ({
    ...vote,
    media: mediaById.get(vote.sidequest_id),
    user: userById.get(vote.user_id),
  }));
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return counts;
}

function rankCounts(values: string[]) {
  return [...countBy(values)].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}
