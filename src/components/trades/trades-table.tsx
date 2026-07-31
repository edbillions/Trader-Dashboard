"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { formatCurrency, formatR } from "@/lib/pnl";
import { bulkDeleteTradesAction } from "@/lib/actions/journal";
import { RMultipleBar } from "@/components/trades/r-multiple-bar";
import type { TradeListItem } from "@/lib/data/trades";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

const GRADE_CLASS: Record<string, string> = {
  "A+": "border-profit/40 bg-profit-muted text-profit",
  A: "border-profit/40 bg-profit-muted text-profit",
  B: "border-accent/40 bg-accent/10 text-accent",
  C: "border-border bg-surface-raised text-muted",
  D: "border-loss/40 bg-loss-muted text-loss",
  F: "border-loss/40 bg-loss-muted text-loss",
};

function StatusBadge({ netPnl }: { netPnl: number | null }) {
  if (netPnl == null) {
    return (
      <span className="whitespace-nowrap rounded-full border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-semibold text-muted">
        OPEN
      </span>
    );
  }
  if (netPnl === 0) {
    return (
      <span className="whitespace-nowrap rounded-full border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] font-semibold text-muted">
        BREAKEVEN
      </span>
    );
  }
  return netPnl > 0 ? (
    <span className="whitespace-nowrap rounded-full border border-profit/40 bg-profit-muted px-1.5 py-0.5 text-[10px] font-semibold text-profit">
      WIN
    </span>
  ) : (
    <span className="whitespace-nowrap rounded-full border border-loss/40 bg-loss-muted px-1.5 py-0.5 text-[10px] font-semibold text-loss">
      LOSS
    </span>
  );
}

export function TradesTable({ trades }: { trades: TradeListItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allSelected = trades.length > 0 && selected.size === trades.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(trades.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    if (selected.size === 0) return;
    const count = selected.size;
    if (
      !window.confirm(
        `Delete ${count} selected trade${count === 1 ? "" : "s"}? This can't be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await bulkDeleteTradesAction([...selected]);
        setSelected(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete trades.");
      }
    });
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Your trades report
        </h2>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-loss">{error}</span>}
          <button
            type="button"
            disabled={selected.size === 0 || isPending}
            onClick={handleBulkDelete}
            className={clsx(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              selected.size > 0
                ? "border-loss/40 text-loss hover:bg-loss-muted"
                : "border-border text-muted",
              "disabled:opacity-50",
            )}
          >
            {isPending
              ? "Deleting..."
              : selected.size > 0
                ? `Delete selected (${selected.size})`
                : "Bulk actions"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full whitespace-nowrap text-xs">
          <thead className="bg-surface-raised text-left text-[10px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all trades"
                />
              </th>
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Symbol</th>
              <th className="px-2 py-2">Entry</th>
              <th className="px-2 py-2">Exit</th>
              <th className="px-2 py-2">Net P&L</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Side</th>
              <th className="px-2 py-2">Setups</th>
              <th className="px-2 py-2">Grade</th>
              <th className="px-2 py-2">R multiple</th>
              <th className="px-2 py-2">Account</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr
                key={t.id}
                className={clsx(
                  "border-t border-border hover:bg-surface-raised",
                  selected.has(t.id) && "bg-accent/5",
                )}
              >
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    aria-label={`Select ${t.symbol} trade`}
                  />
                </td>
                <td className="px-2 py-2 text-muted">
                  <Link
                    href={`/trades/${t.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {dateKey(t.tradingDay.date)}
                  </Link>
                </td>
                <td className="px-2 py-2 font-medium text-foreground">
                  {t.symbol}
                </td>
                <td className="px-2 py-2 text-muted">
                  {t.entryPrice.toString()}
                </td>
                <td className="px-2 py-2 text-muted">
                  {t.exitPrice != null ? t.exitPrice.toString() : "—"}
                </td>
                <td
                  className={
                    (t.netPnl ?? 0) >= 0
                      ? "px-2 py-2 font-semibold text-profit"
                      : "px-2 py-2 font-semibold text-loss"
                  }
                >
                  {formatCurrency(t.netPnl)}
                </td>
                <td className="px-2 py-2">
                  <StatusBadge netPnl={t.netPnl} />
                </td>
                <td className="px-2 py-2 text-muted uppercase">
                  {t.direction}
                </td>
                <td className="px-2 py-2">
                  {t.entryModel ? (
                    <span className="whitespace-nowrap rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      {t.entryModel}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  {t.setupGrade ? (
                    <span
                      className={clsx(
                        "whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                        GRADE_CLASS[t.setupGrade] ??
                          "border-border bg-surface-raised text-muted",
                      )}
                    >
                      {t.setupGrade}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    <RMultipleBar rMultiple={t.rMultiple} width={64} />
                    <span className="text-[10px] text-muted">
                      {formatR(t.rMultiple)}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-muted">
                  {t.account ? t.account.firmName : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
