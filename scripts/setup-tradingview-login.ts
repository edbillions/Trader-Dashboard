import readline from "readline";
import { getTradingViewContext } from "@/lib/browser/tradingview-context";

async function waitForEnter(prompt: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => rl.question(prompt, () => resolve()));
  rl.close();
}

async function main() {
  console.log("Opening a browser window for a one-time TradingView login...");
  const context = await getTradingViewContext({ headless: false });
  const page = await context.newPage();
  await page.goto("https://www.tradingview.com/chart/");

  await waitForEnter(
    "\nLog into TradingView in the window that just opened, then come back here " +
      "and press Enter (the session will be saved so this never has to happen again)...\n",
  );

  await context.close();
  console.log("Login saved to .tradingview-profile/ — you're all set.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
