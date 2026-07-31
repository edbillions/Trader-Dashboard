"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from "@/lib/domain/account-type";

export function AnalyticsFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const accountType = searchParams.get("accountType") ?? "";

  function updateAccountType(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("accountType", value);
    else params.delete("accountType");
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="mb-6 flex items-center gap-3">
      <select
        value={accountType}
        onChange={(e) => updateAccountType(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
      >
        <option value="">All account types</option>
        {ACCOUNT_TYPES.map((t) => (
          <option key={t} value={t}>
            {ACCOUNT_TYPE_LABELS[t]}
          </option>
        ))}
      </select>
      {accountType && (
        <button
          type="button"
          onClick={() => updateAccountType("")}
          className="text-sm font-medium text-accent hover:underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
