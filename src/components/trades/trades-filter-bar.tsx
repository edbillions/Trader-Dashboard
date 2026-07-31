"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/domain/account-type";

export function TradesFilterBar({
  accounts,
}: {
  accounts: { id: string; firmName: string; accountName: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  const accountId = searchParams.get("accountId") ?? "";
  const accountType = searchParams.get("accountType") ?? "";
  const start = searchParams.get("start") ?? "";
  const end = searchParams.get("end") ?? "";
  const hasFilters =
    accountId !== "" || accountType !== "" || start !== "" || end !== "";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        value={accountType}
        onChange={(e) => updateParam("accountType", e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
      >
        <option value="">All account types</option>
        {ACCOUNT_TYPES.map((t) => (
          <option key={t} value={t}>
            {ACCOUNT_TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      <select
        value={accountId}
        onChange={(e) => updateParam("accountId", e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
      >
        <option value="">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.firmName} · {a.accountName}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => updateParam("start", e.target.value)}
          max={end || undefined}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        />
        <span className="text-sm text-muted">to</span>
        <input
          type="date"
          value={end}
          onChange={(e) => updateParam("end", e.target.value)}
          min={start || undefined}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="text-sm font-medium text-accent hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
