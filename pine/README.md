# Pine Scripts

TradingView indicators used alongside the dashboard. Paste the `.pine` file into the
TradingView Pine Editor and "Add to chart".

## `ict-htf-candles.pine`

A fork of **ICT HTF Candles (fadi)** by fadizeidan (MPL-2.0) — the indicator that draws up to
six higher-timeframe candle sets to the right of the live chart, with fair value gaps and
volume imbalances inside each set.

### What's changed from the original

#### 1. Previous Candle Levels

Marks the **high**, **low**, and **middle (50%)** of the last *closed* candle on every
timeframe, and carries those levels across the candle that is still forming — so a sweep,
bounce, or breakout of the prior candle is visible while you're trading a lower timeframe.

- The high and the low are the candle's extremes (wick to wick).
- The middle is the 50% marker, measured either **High to Low** (default) or **Open to
  Close** — the setting is in the *Previous Candle Levels* group.
- Each level has its own color / style / width, defaulting to solid black for the extremes and
  a soft dotted black for the 50%.
- `Extend past the open candle` adds N bars of run-off to the right of the forming candle.
- `Extend back to the live chart` projects the levels left, back to the bar where the prior
  HTF candle opened, so they sit over live price action instead of only over the HTF panel.
- Optional `PH` / `50%` / `PL` labels at the right end of each line.

The levels are redrawn from the current set on every realtime tick, so when an HTF candle
closes, the levels roll forward to it automatically.

**Sweep state.** Each level is restyled — dotted blue by default — for as long as it is being
*swept*: the open candle has traded through the level but has not closed through it. The
moment the candle closes through the level, it reverts to its normal solid styling; if price
wicks through and closes back inside the previous candle's range, it stays blue and dotted.
The level labels take the same color, so `PH` / `50%` / `PL` turn blue with their line.

| Level | Swept (blue dotted) | Normal (solid black) |
| --- | --- | --- |
| High | `high > PH` and `close ≤ PH` | never reached, or `close > PH` |
| Low | `low < PL` and `close ≥ PL` | never reached, or `close < PL` |
| 50% | crossed, and close is back on the side the candle opened from | never crossed, or closed through |

`high` / `low` / `close` here are the *running* values of the higher-timeframe candle that is
still forming, so the state updates tick by tick and resets when that candle closes and the
levels roll forward to it. The swept color / style / width are their own inputs, and
`Sweep styling applies to` limits the behavior to the high and low if you'd rather the 50%
line never change.

#### 2. Swing highs and lows

A swing high or low gets a blue dotted line running from the swing candle to the wick of the
candle that swept it — but only while that swing is being **swept**, so the panel stays clean
and a line showing up means something is happening at that price right now. The line stops at
the sweeping wick rather than running past it, so it reads as "this candle took that level".
An unswept swing (only visible with the swept-only option off) runs to the right edge of the
set instead.

A swing is a fractal: a candle whose high sits above the highs of `Candles either side`
candles on both sides of it, and the mirror of that for a low. The default of 1 is a classic
3-candle fractal; raise it for fewer, more significant swings. Equal highs don't qualify, so
a double top doesn't draw two stacked lines.

A swing counts as swept when some candle printed after it has traded through the level while
none has closed through it — the same take-but-no-acceptance test the previous candle levels
use, run across every later candle rather than just the one still forming. So the line appears
the moment price runs the swing, stays for as long as price keeps failing back, and vanishes
once a candle closes through. `Only draw a swing while it is swept` turns this off if you'd
rather see a line on every swing.

The candle still forming can never be a swing — there's nothing to its right yet — so a swing
only appears once enough candles have printed after it. The *previous* candle is also left out
of the scan while Previous Candle Levels are on, since it already carries its own high/low
lines and would otherwise get two differently-styled lines at one price.

Colors, styles, widths, and the right-side run-off are in the *Swing Highs & Lows* group.

#### 3. FVG consequent encroachment (50%)

Fair value gaps now get an optional dotted midline at the 50% of the gap — the level price
most often reacts to when it trades back into the gap. Toggle, color, and line style live in
the *Imbalance* group.

#### 4. Cleaner default styling

Defaults only — every one of these is still a normal input you can change:

- Bodies use the standard teal/red (`#26a69a` / `#ef5350`) instead of `color.green` /
  `color.red`, with borders and wicks in a slightly darker matching hue rather than black.
  Candles read as one solid shape instead of a black-outlined block.
- Fair value gaps are a soft neutral gray at 85% transparency (was gray at 80%), so they sit
  behind the candles instead of competing with them.
- Volume imbalances are a light pink at 82% transparency (was red at 50%).
- Default candle width is 2 (4 bars wide) with the existing 1-bar gap, giving the wider,
  better-separated candles of the reference layout.

### Licensing

The original is MPL-2.0; this modified copy stays under the same license and keeps the
original author's attribution in the file header.
