import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BrowserContext } from "playwright";
import { prisma } from "@/lib/prisma";
import { getTradingViewContext } from "@/lib/browser/tradingview-context";
import type { Instrument, Timeframe } from "@/lib/ai/premarket-analysis";

const TIMEFRAMES: Timeframe[] = ["1h", "15m", "1m"];

export interface CapturedChart {
  timeframe: Timeframe;
  filePath: string; // web path, e.g. /uploads/premarket/<uuid>.jpg
  base64: string;
}

// Sequential, not parallel — avoids CPU contention from multiple heavy chart
// renders competing in the same local browser for what's an on-demand, once-a-day action.
//
// Accepts an optional shared browser context so a caller processing multiple
// instruments (e.g. NQ then ES) can reuse one context instead of each launching
// its own — Chromium's persistent-profile lock means two concurrent
// `launchPersistentContext` calls on the same profile directory fight over the
// same login session, silently logging one of them out mid-run.
export async function captureChartScreenshots(
  instrument: Instrument,
  phase: "morning" | "eod",
  sharedContext?: BrowserContext,
): Promise<CapturedChart[]> {
  const layouts = await prisma.tradingViewLayout.findMany({ where: { instrument } });
  const layoutByTimeframe = new Map(layouts.map((l) => [l.timeframe, l.url]));

  const missing = TIMEFRAMES.filter((tf) => !layoutByTimeframe.has(tf));
  if (missing.length > 0) {
    throw new Error(
      `No TradingView layout URL saved for ${instrument} ${missing.join(", ")} — ` +
        "add one in Settings under TradingView chart layouts.",
    );
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "premarket");
  await mkdir(uploadsDir, { recursive: true });

  const context = sharedContext ?? (await getTradingViewContext({ headless: true }));
  const results: CapturedChart[] = [];

  try {
    for (const timeframe of TIMEFRAMES) {
      const url = layoutByTimeframe.get(timeframe)!;
      const page = await context.newPage();

      try {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => {});
        // TradingView renders on canvas with no public "chart ready" selector —
        // a fixed settle delay is the pragmatic default.
        await page.waitForTimeout(3000);

        const buffer = await page.screenshot({ type: "jpeg", quality: 80 });

        const filename = `${phase}-${instrument}-${timeframe}-${randomUUID()}.jpg`;
        await writeFile(path.join(uploadsDir, filename), buffer);

        results.push({
          timeframe,
          filePath: `/uploads/premarket/${filename}`,
          base64: buffer.toString("base64"),
        });
      } catch (err) {
        throw new Error(
          `Failed to capture ${instrument} ${timeframe} chart at "${await page
            .title()
            .catch(() => "unknown title")}" (${page.url()}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    if (!sharedContext) await context.close();
  }

  return results;
}
