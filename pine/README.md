# Unicorn° [Pro+] — TradingView Indicator

Pine Script v6 implementation of the ICT Unicorn Model described in the dashboard's
[Unicorn Playbook](../src/app/playbook/unicorn-playbook.tsx).

## Install

1. TradingView → **Pine Editor** → **Open** → *New indicator*.
2. Paste the contents of [`unicorn-pro-plus.pine`](./unicorn-pro-plus.pine).
3. **Save**, then **Add to chart**.

Built and checked against **NQ1! / ES1! on 15m**, which is the operating context in the
playbook (NQ/ES futures, New York AM).

## The model

Bullish sequence (bearish is mirrored):

```
Low → High → Lower Low (sweeps liquidity) → displacement close above the High (MSS)
```

The last down-close candle of the sweep leg becomes the **bullish breaker**. Where that
breaker's price range overlaps a **Fair Value Gap**, two independent signals occupy the same
price — that overlap is the **Unicorn zone**, and it is where the entry sits.

A setup with no breaker/FVG overlap is a look-alike, not a Unicorn. Under the default
`Model Mode` it is never promoted.

## Settings that change behaviour most

| Setting | Effect |
|---|---|
| **Model Mode** | `Unicorn` requires the breaker/FVG overlap. `Breaker Only` drops that requirement. `Unicorn + Breaker` shows both, labelled separately. |
| **Unicorn FVG Source** | Which gap has to overlap the breaker: the paired HTF gap (default, matches the reference charts), the chart-timeframe gap (playbook-strict), or either. |
| **Use Swing as Invalidation** | On — stop beyond the swept swing. Off — stop at the breaker's far edge. The two invalidation types from playbook §09. |
| **Projection Calculation** | `Breaker Range` measures 1R from the breaker's height; `Confirmation Close` measures it from the close of the candle that broke structure. This visibly moves the 2R line and the R:R bar. |
| **Bias Filter** | `Auto` derives bias from the paired HTF range position and skips counter-bias setups. |
| **Daily Trade Limit** | Once the day's win or loss budget is spent, no new models confirm. Defaults to 1 win / 2 losses. |

## Liquidity sources

Sweeps are detected against chart swings, HTF swings, HTF OHLC levels, previous day high/low,
and the four configurable session windows (Asia, London, New York AM, New York PM by default).
The source that was swept becomes the label on the swing connector and the `[...]` tag in every
alert for that model, using the same names as the dashboard's `LIQ_SWEPT_LABELS`.

With **SMT Divergence** enabled and correlated tickers set, a sweep where this market takes out
its level but the correlated one does not is labelled with the diverging ticker (`ES`, `GC`,
`GBPUSD`) instead of the level name.

## Alerts

Message format matches the alerts already referenced in the playbook, so existing routing keeps
working:

```
Potential 1m Bearish Unicorn [15m OHLC]
Confirmed 1m Bearish Unicorn [15m OHLC]
Entry — 1m Bearish Unicorn [15m OHLC]
Break-Even — 1m Bearish Unicorn [15m OHLC]
Target Reached — 1m Bearish Unicorn [15m OHLC]
Stop Loss — 1m Bearish Unicorn [15m OHLC]
Invalidated — 1m Bearish Unicorn [15m OHLC]
```

Create the alert with **Any alert() function call**; the per-event toggles live in the ALERTS
input group.

## Statistics

The monthly table counts trades the indicator itself tracked from confirmation to close.
**Win% excludes break-even trades** — it is `W / (W + L)`, not `W / T`.

These are the model's own mechanical results at a fixed target R. They are not your journal's
numbers, and they do not account for grade-based sizing or discretionary management.

## Known limits

- **Drawing budget.** TradingView caps a script at 500 boxes / lines / labels. Each model owns
  up to nine drawings, so `History Limit` is capped at 50. Raise it only if old models are not
  disappearing on their own.
- **The live HTF candle** in the right-hand panel is rebuilt from chart bars and updates about
  one chart bar after the HTF candle actually closes. This is deliberate — every
  `request.security` call uses `lookahead_off`, so nothing on the chart is drawn from data that
  was not available at the time.
- **Statistics are backtest-style.** Entries assume a limit fill at the zone edge with no
  slippage or commission, and intrabar sequencing is inferred from bar highs and lows. A bar
  whose range covers both the stop and the target is genuinely ambiguous; by default it is
  counted as a loss (`Ambiguous Bars Count as Losses`), so the win rate errs low rather than
  high.
