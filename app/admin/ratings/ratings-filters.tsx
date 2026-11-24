"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

type FilterOption = { value: string; label: string };

export default function RatingsFilters({ value, user, neighborhood, users, neighborhoods }: {
  value: string;
  user: string;
  neighborhood: string;
  users: FilterOption[];
  neighborhoods: FilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function applyFilter(name: "value" | "user" | "neighborhood", nextValue: string) {
    const params = new URLSearchParams(window.location.search);
    if (nextValue === "all") params.delete(name);
    else params.set(name, nextValue);
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  return (
    <div className="toolbar ratings-toolbar" aria-label="Filter ratings" aria-busy={isPending}>
      <label><span>Rating</span><select value={value} onChange={(event) => applyFilter("value", event.target.value)}><option value="all">All ratings</option><option value="1">Worth it</option><option value="-1">Skip it</option></select></label>
      <label><span>User</span><select value={user} onChange={(event) => applyFilter("user", event.target.value)}><option value="all">All users</option>{users.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label><span>Neighborhood</span><select value={neighborhood} onChange={(event) => applyFilter("neighborhood", event.target.value)}><option value="all">All neighborhoods</option>{neighborhoods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <span className="filter-status" aria-live="polite">{isPending ? "Updating…" : "Updates automatically"}</span>
    </div>
  );
}
