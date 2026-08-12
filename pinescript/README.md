# Pine Script

## `unicorn-model-strategy.pine`

A backtestable **strategy** build of the "Unicorn Model + HTF FVG" indicator.

The signal engine is reproduced verbatim — same sweep tracking, breaker
construction, FVG overlap, size filter, time filter, HTF FVG qualification,
diagnostics and dashboards. A setup confirms on exactly the same bar, under
exactly the same conditions, as it does in the indicator. Everything added for
backtesting is marked `[STRATEGY]` in the source and confined to three places:

| Where | What |
| --- | --- |
| The declaration | `indicator()` → `strategy()` with backtest properties |
| Input group 13, "Backtest Execution" | Order behaviour only — nothing the engine reads |
| End of each confirmation block, plus the execution section | Reads the engine's finished decision and turns it into orders |

Two things could not carry over:

- **`alertcondition()` is unavailable in strategy scripts**, so the indicator's
  four calls are gone. Nothing is lost: the qualified-Unicorn and FVG-tap
  messages are already fired by `alert()` inside the engine.
- **Position sizing now drives real orders** instead of only printing on the
  dashboard. The Position Sizing input group is unchanged and feeds both.

### Trade mechanics

- **Entry** — the confirmation bar's close (the indicator's own `entryPrice`), or
  a limit order resting back inside the breaker if you switch to
  *Retrace Into Breaker*.
- **Stop** — the setup's `invalidationPrice`, so it honours the
  *Use Swing as Invalidation?* toggle exactly as the chart drawing does.
- **Target** — the `R:R` input from Target Projections, i.e. the same line the
  indicator draws. Optional scale-out plus a runner, break-even move, and an
  ATR or structure trail.
- **Filters** — bias, Unicorn Mode, breaker size, time filter and HTF FVG
  qualification are all the engine's own. A setup hidden by *Only Show Qualified
  Setups?* is not traded either, so orders always match the chart. Optional
  daily limits (max trades, stop after a loss, stop after a win) sit on top,
  off by default so the raw edge is measured before the discipline rules are.

### Fill model — read this before trusting a result

`process_orders_on_close = true`, so a market entry fills at the confirmation
bar's close. That is the only way to measure the geometry the indicator draws,
but it assumes you got filled at the print that confirmed the setup. Commission
($2.50/contract) and 1 tick of slippage are set as a partial offset — change
both in Properties to match your broker. For a more conservative model, use
*Retrace Into Breaker* entries, where a resting limit has to actually be hit.

### Running it

1. Paste into the Pine editor, "Add to chart".
2. Use a **standard candle chart** — Heikin Ashi and Renko falsify fills.
3. Leave **"Recalculate on every tick" off**.
4. Set *Account Balance* and *Risk Amount* under Position Sizing, and
   *Initial capital* in Properties, to the same number.
5. Leave *Wait for candle close to identify FVG* **on**. With it off,
   qualification can depend on gaps that never finished forming.

The engine's `History` input only governs how many setups stay drawn — every
confirmed setup is traded regardless of it.
