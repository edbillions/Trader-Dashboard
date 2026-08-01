"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { toggleTradeReviewedAction } from "@/lib/actions/journal";

export function ReviewedButton({
  tradeId,
  reviewed,
}: {
  tradeId: string;
  reviewed: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleTradeReviewedAction(tradeId, !reviewed);
      window.location.reload();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={clsx(
        "rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60",
        reviewed
          ? "border-profit/40 bg-profit-muted text-profit"
          : "border-border text-foreground hover:bg-surface-raised",
      )}
    >
      {isPending ? "Saving..." : reviewed ? "Reviewed ✓" : "Mark reviewed"}
    </button>
  );
}
