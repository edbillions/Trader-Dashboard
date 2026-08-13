# Unicorn Model — HTF FVG / Session Liquidity / Volume confluence layer

`unicorn-model.pine` is the original Unicorn Model plus three **optional** confluence filters.
`unicorn-model.original.pine` is the unmodified baseline, kept beside it so the change can be
diffed and so both can be loaded on the same chart for regression testing.

> The only difference between `unicorn-model.original.pine` and the script as delivered is line
> endings (CRLF normalised to LF). No content was altered.

```
git diff --no-index pine/unicorn-model.original.pine pine/unicorn-model.pine
```

That diff is **409 insertions, 4 deletions**. The four changed lines are:

| Original line | Change |
|---|---|
| `if riskRange > 0` (bullish block) | → `if riskRange > 0 and confluencePass` |
| `if riskRange > 0` (bearish block) | → `if riskRange > 0 and confluencePass` |
| `rows = 14,` (dashboard table) | → `rows = 18,` |
| last line (no trailing newline) | trailing newline added |

Everything else is purely additive.

---

## 1. What was added

### Inputs — new group "HTF FVG Delivery & Confluence"

**Filter 1 — Require Delivery from HTF FVG** (default `false`)
- HTF FVG Timeframe Mode: Automatic / Manual. Automatic = Liquidity **Source B**'s resolved
  timeframe (mid of the existing hierarchy: 1H on a 5m chart, 4H on a 15m chart).
- Manual HTF FVG Timeframe (default `60`)
- **Delivery Requirement**: `Touch` / `Enter` / `50%` (default `Touch`)
- FVG Mitigation Rule: `Close Through` (default) / `Wick Through`
- **Max HTF FVG Age (HTF Bars)** — default 50, counted in **HTF bars**
- Min HTF FVG Size (× HTF ATR) — default 0 (off)
- Show HTF FVGs (default off) + two box colors

**Filter 2 — Require Session Liquidity Delivery** (default `false`)
- Asian (`1800-0300`), London (`0300-0800`), New York (`0800-1700`) — each with its own
  enable toggle and editable session string
- **Session Sweep Validity (Chart Bars)** — default 100, counted in **chart bars**
- Show Session Liquidity (default off)

**Filter 3 — Require Influx of Volume** (default `false`)
- Volume Lookback (20), Volume Multiplier (1.5)
- **Volume Confirmation Window (Chart Bars)** — default 10
- Show Volume Confirmation (default off)

Units are never mixed: FVG age is in HTF bars, the session sweep window and the volume
confirmation window are in chart bars, and each label says so.

### Engine

- `type HTFFVG` / `type SessLevel` + two bounded state arrays (`htfFvgs` capped at 40,
  `sessLevels` capped at 24; pruned entries have their boxes/lines deleted).
- `f_htfFvgData()` + one extra `request.security(..., barmerge.lookahead_off)`.
- New "CONFLUENCE LAYER STATE UPDATE" section, placed between the existing
  "2. Process & Track Sweeps" and "3. Track & Confirm Pending Setups", so every flag a gate
  reads is already latched for the current bar before confirmation runs.
- Helpers: `f_confTz`, `f_trackSession`, `f_pushSessLevel`, `f_htfFvgGateOK`,
  `f_sessionGateOK`, `f_volumeGateOK`, `f_confluenceGate`, `f_confluenceTagText`.
- Dashboard rows 13–17 (`── CONFLUENCE ──` + one row per enabled filter, live per-direction
  state `↑✓ ↓✕`), populated **only** when at least one filter is enabled.
- Setup tooltip gets one extra `Confluence: …` line, **only** when a filter is enabled.
- `plotchar` marker on volume-spike bars, drawn only when Show Volume Confirmation is on.

### Delivery Requirement — the three modes are genuinely different

Three **independent** flags are latched per HTF FVG; the gate reads only the selected one.
`eq = (top + bottom) / 2`.

| Mode | Test | Rejects |
|---|---|---|
| Touch | `high >= bottom and low <= top` | bars whose range never reaches the gap |
| Enter | `math.min(high, top) > math.max(low, bottom)` | boundary-only kisses (zero-width overlap) |
| 50% | `low <= eq and high >= eq` | bars that never straddle the equilibrium, **including bars entirely beyond the gap** |

The 50% test is a range intersection with the equilibrium level, not a one-sided comparison, so a
candle that has already travelled completely through/past the gap cannot register a 50% delivery.
No directional-approach requirement is bundled into these modes; if one is wanted it should be
added later as its own explicit input.

### Volume window

```
lastVolSpikeBar >= breakerSeriesStartBar - volumeConfWindow
lastVolSpikeBar <= bar_index
```

`breakerSeriesStartBar` is `bar_index - endOffset`, the chronologically earliest bar of the breaker
series — the same value the existing code already passes to `f_findBullishFVG` /
`f_findBearishFVG`. A spike older than that window cannot qualify a setup. On symbols with no
volume data the gate returns **false** when enabled (fails closed — never a false confirmation).

### Final confluence logic

```
Bullish: existing bullish Unicorn conditions
         AND (HTF FVG filter off      OR bullish HTF FVG delivery valid)
         AND (Session Liquidity off   OR a session-LOW sweep is inside the window)
         AND (Volume filter off       OR a volume influx is inside the window)

Bearish: existing bearish Unicorn conditions
         AND (HTF FVG filter off      OR bearish HTF FVG delivery valid)
         AND (Session Liquidity off   OR a session-HIGH sweep is inside the window)
         AND (Volume filter off       OR a volume influx is inside the window)
```

---

## 2. No delayed signals — how it is enforced

In the original engine a rejected confirmation leaves the pending sweep alive, and the breaker
search is anchored at/behind the sweep bar, so the *same* breaker series can satisfy the
confirmation conditions again several bars later. Without a guard, a confluence rejection would
inherit that behaviour and produce a delayed signal once the missing condition finally became true.

The guard: when a gate rejects a confirmation, the breaker identity
(`bar_index - startOffset`, `bar_index - endOffset`) is recorded per direction. Any later bar that
reaches the confirmation point with the **same** breaker identity is refused outright — the gate is
not even consulted. The record is cleared only when the existing engine opens a **new sweep
context** (a fresh `sweptBear` / `sweptBull` event resets `pendingBull/BearFirstSweepBar`).

Consequences:

- Confluence passes at the existing confirmation bar → signal on **that** bar, never shifted.
- Confluence fails at the existing confirmation bar → no signal for that breaker instance, ever.
- A later bar satisfying the previously failed condition → **no** delayed signal.
- A genuinely new breaker series (different bars) is a new confirmation point, evaluated fresh.
- The existing engine's own pending state is untouched: a setup that has not yet reached its
  confirmation point still confirms naturally whenever the existing conditions first pass.

The rejection variables are only written inside the `anyConfluenceOn` branch, so with all three
filters off they stay `na` and the branch never executes.

---

## 3. Existing logic intentionally left unchanged

- HTF liquidity registration (`f_registerLevel`) and the four liquidity sources A–D
- Sweep detection and the sweep state machine, pending bull/bear sweep tracking
- Breaker series detection (`f_findUpCandlesSeries` / `f_findDownCandlesSeries`), breaker
  validation, breaker size filter
- LTF FVG detection (`f_findBullishFVG` / `f_findBearishFVG`), the FVG ATR filter, and **Unicorn
  Mode** — the new HTF FVG filter is additional and does not replace the LTF FVG requirement
- Entry price, invalidation (including Use Swing as Invalidation), risk range, R:R and additional
  targets, target-hit tracking, position sizing
- Time filter, bias filter, history limit, discard-invalidated behaviour
- All existing alerts. The Activation alert sits inside the confirmation block, so it can only fire
  after every enabled gate has passed. The Potential Breaker alert is unchanged by design — it
  still describes a *forming* breaker and is never promoted into a confirmed Unicorn alert.
- Dashboard layout, colors, sizes, and all rows 0–12

---

## 4. Non-repainting safeguards

1. `barmerge.lookahead_off` on the new `request.security` — the file contains **zero** occurrences
   of `lookahead_on`.
2. `f_htfFvgData()` reads only offsets ≥ 1 (`low[1]`, `high[1]`, `low[3]`, `high[3]`,
   `ta.atr(14)[1]`, `time[1]`), so nothing it returns can come from a still-forming HTF bar.
3. An HTF FVG is registered only on the chart bar where the confirmed HTF bar time changes — the
   gap cannot exist before its third HTF candle has closed.
4. The ATR used for the optional minimum-size test is the **confirmed** HTF ATR captured at
   formation (`ta.atr(14)[1]` from the same request), stored on the FVG object.
5. Delivery flags and mitigation are latched from the current bar's own high/low/close and are
   never revisited, so a future interaction can never qualify a past setup.
6. Session levels are published only **after** a session closes, and a level cannot be swept on the
   bar it was published (`formBar < bar_index`). No in-progress session extreme is ever used.
7. Volume uses only `volume` and `ta.sma(volume, …)` on the bar itself; the spike bar index is
   latched forward in time only.
8. Every gate is evaluated on the confirmation bar, from state that already existed on that bar.
9. The delayed-signal guard in section 2 prevents any retroactive activation.
10. All new arrays are bounded and pruned deterministically; no state depends on bar direction of
    travel other than forward.

---

## 5. Test protocol

Pine cannot be compiled outside TradingView, so the script here was validated by static review
(declaration order, delimiter balance, indentation, no `lookahead_on`, tuple arity) and by the
diff above. **Compilation and the chart tests below are the one-click step on your side.**

### 5.1 Regression — all three filters OFF

Load `unicorn-model.original.pine` and `unicorn-model.pine` on the same chart with identical
settings and all three new filters off. These must be identical **bar for bar**:

- [ ] Unicorn signals (`+Unicorn` / `-Unicorn`) — same bars, same prices
- [ ] Breaker signals (`+Breaker` / `-Breaker`) — same bars
- [ ] Breaker boxes, FVG boxes, sweep lines and level labels — same coordinates
- [ ] Entry, invalidation, R:R and additional targets — same values
- [ ] Invalidation and target-hit transitions — same bars
- [ ] Alerts — same firings
- [ ] Dashboard — identical layout and content (no CONFLUENCE section)

If anything differs with all three filters disabled, stop and diagnose before going further.

### 5.2 One filter at a time

For each filter enabled alone:

- [ ] Every surviving signal appears on **the same bar** as in the all-off baseline
- [ ] Only setups that fail that filter disappear
- [ ] **No new signal appears** that was not in the baseline

### 5.3 Delayed-signal test (run once per filter)

This is the test for clarification 3/4 and must pass for all three filters:

1. Find a setup the enabled filter rejects (present in the baseline, absent with the filter on).
2. Step forward through the bars after that confirmation bar until the missing condition becomes
   true — a volume spike (Volume), price tapping/entering the HTF FVG (HTF FVG), or a session
   high/low being swept (Session Liquidity).
3. **Expected: no signal ever appears for that old breaker.** A signal appearing on the later bar
   is a failure of the guard, not a valid confirmation.
4. Confirm that a genuinely new sweep → new breaker after that point can still confirm normally.

Summary of the required behaviour:

| Situation | Expected |
|---|---|
| Existing confirmation + confluence passes | signal on the existing confirmation bar |
| Existing confirmation + confluence fails | no signal |
| Later bar satisfies the previously failed condition | **no delayed signal** |
| New sweep → new breaker, confluence passes | normal signal on its own confirmation bar |

### 5.4 Delivery-mode differentiation

On a chart with `Show HTF FVGs` on, switch Delivery Requirement between Touch → Enter → 50% and
confirm the qualifying set shrinks (Touch ⊇ Enter, Touch ⊇ 50%). If all three modes produce
identical results on a symbol with plenty of HTF gaps, something is wrong.

### 5.5 Real-time / replay

- [ ] Bar Replay through a region containing signals — signals appear on the same bars as in
      historical mode and do not move once the bar closes
- [ ] Leave it running live for a session — no signal repositions after its bar closes
