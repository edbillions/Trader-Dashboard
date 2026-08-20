# TradingView indicators

Pine Script sources kept alongside the dashboard. Nothing here is built or
imported by the Next.js app — these are pasted into TradingView by hand.

## `watermark-quote.pine` — Watermark + Quote

Merges the two scripts that used to run side by side (an AG FX-style watermark
and a Sonarlab-style checklist/quote block) into one indicator, so it takes a
single indicator slot and a single settings dialog.

It draws three independent blocks:

| Block          | Lines                                | Default position |
| -------------- | ------------------------------------ | ---------------- |
| Quote          | Quote Title, Quote Body              | top / center     |
| Watermark text | Title, Subtitle                      | bottom / center  |
| Symbol info    | date, `TICKER \| TF`                 | bottom / center  |

### Install

1. TradingView → **Pine Editor** → **Open** → **New indicator**.
2. Replace the contents with `watermark-quote.pine`.
3. **Save**, then **Add to chart**.
4. Remove the two old indicators once you've confirmed this one matches.

### Inputs

- **Text** — `Title` and `Subtitle`: free watermark text. Empty lines are
  skipped entirely, so leaving both blank shows nothing.
- **Quote** — `Show Quote`, `Quote Title`, and a multi-line `Quote Body`.
- **Quote / Watermark / Symbol Position** — each block gets its own vertical
  (`top`/`middle`/`bottom`) and horizontal (`left`/`center`/`right`) placement.
  `Show Symbol Info` toggles the date + symbol block.
- **Symbol Info** — toggle the date and symbol lines separately, set the date
  pattern (`d/M/yyyy` → `20/8/2026`), override the time zone (empty = the
  exchange's), and pick `MNQ1!` vs `CME_MINI:MNQ1!`.
- **Cell Size** — `Width`/`Height` as a percent of the chart; `0` = auto.
- **Style groups** — Title / Subtitle / Symbol / Quote Title / Quote Body each
  have their own color, size and alignment. **Background** holds the watermark
  and quote background colors (both fully transparent by default).

### Blocks that share a position

TradingView only displays one table per screen position, so two blocks placed
in the same spot would otherwise hide each other. Instead, the script pools all
visible lines by position and renders one table per position, stacked in this
fixed order:

```
quote title → quote body → watermark title → watermark subtitle → date → symbol
```

That means putting the watermark and symbol info both at `bottom / center`
(the default) gives one tidy block, and moving the watermark up to
`top / center` merges it under the quote rather than on top of it.

### Timeframe labels

The symbol line renders the timeframe as `30S`, `1M`, `15M`, `1H`, `4H`, `1D`,
`1W`, `1Mo` — minutes use `M` and months use `Mo`, matching the old watermark.
