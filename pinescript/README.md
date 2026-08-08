# FVG Multi-Timeframe (Pine Script v6)

A TradingView indicator that plots Fair Value Gaps from **up to five timeframes at once** on a
single chart — so an M15 or H1 imbalance stays on screen while you execute on a 1m/2m chart.

File: [`fvg-multi-timeframe.pine`](./fvg-multi-timeframe.pine)

## Install

1. Open any chart on TradingView → **Pine Editor** (bottom panel).
2. Paste the full contents of `fvg-multi-timeframe.pine`, replacing whatever is there.
3. **Save** (give it a name), then **Add to chart**.
4. Open the indicator's settings (gear icon) to configure it.

To keep it across charts, save it to your favourites — it will show up under
*Indicators → My scripts*.

## What counts as an FVG

Three consecutive candles on the source timeframe:

- **Bullish** — candle 3's low is above candle 1's high. The gap is `high[1] → low[3]`.
- **Bearish** — candle 3's high is below candle 1's low. The gap is `high[3] → low[1]`.

The box spans that price range, starting at the middle candle of the pattern.

## Settings

### Timeframes

Five independent slots. Each row is a timeframe dropdown, a free-text tag drawn on the box
(`M15`, `H1`, …), and a checkbox to enable it. Defaults: **H1 and M15 on**, M5 / H4 / M20 off.

The tag is purely cosmetic — rename it to anything you like.

### FVG Settings

| Setting | What it does |
| --- | --- |
| **Wait for candle close to identify FVG** | On (default): a gap is only drawn once its third candle has *closed* on the source timeframe. Never repaints. Off: the gap is drawn on the still-forming candle and updates live — it can widen, narrow, or vanish before that candle closes. |
| **Filled FVG Type** | `Close` — the gap is filled when a candle closes through its far edge. `Wick` — a wick reaching the far edge is enough. |
| **Extend Boxes** | Keep pushing each box's right edge to the current bar until it fills, instead of using a fixed width. |
| **Delete Boxes after fill** | On: the box disappears when filled. Off: it stays, frozen at the bar that filled it. |
| **Hide FVGs lower than enabled timeframes** | Skips any enabled timeframe shorter than the chart's own. Stops M5 gaps from cluttering an H4 chart. |
| **Max bars back to find FVGs** | Only draw gaps found within this many chart bars of the right edge. Lower it if the chart gets heavy. |
| **Length of Boxes** | Box width in **chart** bars. See the note below. |

### Box / Label / Border Visuals

Fill colour per direction; label position (left/center/right inside the box), size, and colour per
direction; border style, width, and colour per direction. Borders default to fully transparent, so
boxes render as clean translucent blocks — raise the alpha on the border colours if you want outlines.

Label colours default to a neutral grey that stays readable on both light and dark chart themes.

## Alerts

Two conditions, both firing when price first trades into an unfilled gap:

- *Price entered Bullish FVG*
- *Price entered Bearish FVG*

Set them up the normal way (right-click chart → **Add alert** → condition = FVG Multi-Timeframe).

The script also emits a richer dynamic message through Pine's `alert()` call, which includes the
timeframe tag and the gap's price range — e.g. `NQ1!: price entered bullish FVG (H1) 29604.00 -
29631.25`. To use that one, create an alert with condition **"FVG Multi-Timeframe"** and event
**"Any alert() function call"**. Use one or the other, not both, or you'll get duplicates.

## Notes and limitations

- **Box width.** "Length of Boxes" is measured in bars of the *chart's* timeframe, so a length of
  15 on a 5m chart is 75 minutes. Because a high-timeframe gap's left edge sits well in the past,
  a box is never drawn narrower than the three source candles that formed it — otherwise an H1 box
  on a 1m chart would end before the gap was even confirmed. Turn on **Extend Boxes** if you'd
  rather have them run to the current bar.
- **Fill is measured on the chart's candles**, not the source timeframe's. An H1 gap on a 1m chart
  is marked filled as soon as a 1m candle closes (or wicks) through it. This is the responsive
  behaviour most FVG scripts use; it means a gap can be marked filled before the H1 candle itself
  closes through it.
- **Repainting.** With *Wait for candle close* on, the script uses the standard non-repainting
  multi-timeframe request (last fully-closed source candle, on history and in realtime alike) — no
  future data is read. With it off, live gaps on the forming candle are provisional by design.
- **Drawing limits.** TradingView caps a script at 500 boxes and 500 labels. With all five
  timeframes enabled and a large *Max bars back*, the oldest boxes get dropped. Lower *Max bars
  back* or disable a timeframe if you see gaps missing from the far left.
- The script issues two `request.security()` calls per timeframe slot (ten total, against a limit
  of 40) because Pine requires the `lookahead` argument to be a compile-time constant, so both the
  confirmed and live variants must be requested up front.
