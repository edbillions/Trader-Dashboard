import path from "path";
import type { BrowserContext } from "playwright";

const PROFILE_DIR = path.join(process.cwd(), ".tradingview-profile");

// Launches a persistent local browser profile so the user only ever logs into
// TradingView once by hand (via `npm run tradingview:login`) — the session cookie
// persists across every future automated run. No credentials are ever stored.
export async function getTradingViewContext(
  { headless = true }: { headless?: boolean } = {},
): Promise<BrowserContext> {
  const { chromium } = await import("playwright");
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1600, height: 900 },
  });
}
