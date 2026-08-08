# Unicorn Model + HTF FVG

`unicorn-model-htf-fvg.pine` — one TradingView indicator merging two existing ones:

| Engine | Source | Role |
|---|---|---|
| **Unicorn Model** | your `Unicorn Model` (UM) script | Primary signal engine. Logic unchanged. |
| **ICT HTF FVGs v2** | © fadizeidan, MPL 2.0 | HTF FVG detection + rendering. Unchanged. |

The FVG engine acts as a **required higher-timeframe context filter** on the Unicorn's final
signal. Everything the merge added is marked `HTF FVG FILTER` in the source.

---

## The signal

A Unicorn fires only when **all four** conditions hold:

```
  direction-matched HTF FVG exists
+ price has interacted with it
+ delivery condition satisfied
+ LTF Unicorn setup confirms
= VALID SIGNAL
```

Directional match is mandatory and has no toggle — a bullish Unicorn requires a bullish HTF FVG,
a bearish Unicorn requires a bearish one. Opposite-direction pairings never fire.

### Interaction vs delivery

These are deliberately different tests.

| | Interaction | Delivery (default mode) |
|---|---|---|
| Bullish | `low < fvgTop` — price entered the gap | `close > fvgTop` on a **confirmed** bar — price delivered back out |
| Bearish | `high > fvgBottom` | `close < fvgBottom` on a **confirmed** bar |

Interaction reuses the `Touched` semantics already in the FVG engine's `CheckMitigated`.
Delivery means price *left* the gap in the signal direction — price slicing straight through
never satisfies it, which is the whole point of having it as a separate condition.

`Delivery Definition` can be relaxed to `Close Beyond CE`, which uses the gap's midpoint
(consequent encroachment) instead of the far boundary.

### Ordering

```
HTF FVG forms (confirmed HTF bar)
  └─ interaction      bar i
      └─ delivery     bar j ≥ i    same bar allowed — the wick-in / close-out rejection candle
          └─ Unicorn  bar k ≥ j    same bar allowed
              └─ SIGNAL
```

### Association

`Require Sweep Into FVG?` (on by default) ties a Unicorn to a *specific* FVG: the liquidity sweep
that armed the setup must itself have reached into the gap. Without it, an unrelated older FVG
elsewhere on the chart could validate a new Unicorn.

---

## Settings

Every input from both source indicators is preserved. fadi's groups are prefixed `HTF FVG — …`.
One new group, **`HTF FVG Filter`**:

| Input | Default | Meaning |
|---|---|---|
| Require HTF FVG Context? | `true` | Master switch. Off ⇒ the Unicorn behaves exactly as before the merge. |
| Require Delivery? | `true` | Off ⇒ a bare interaction qualifies. |
| Delivery Definition | `Close Outside FVG` | or `Close Beyond CE` (looser). |
| Require Sweep Into FVG? | `true` | Association rule, above. |
| FVG Freshness (chart bars) | `0` | Max bars from interaction to confirmation. `0` = unlimited. |
| Consume FVG After Signal? | `false` | On ⇒ each FVG validates at most one signal. |
| Show Filter Diagnostic? | `false` | Adds the diagnostic rows to the dashboard. |
| Slot 1…6 | `2,3,4` on | Which HTF FVG timeframe slots may validate a Unicorn. Defaults = 15m / 1H / 4H. |

Slot defaults match the HTF FVG levels in the dashboard's own setup grader
(`src/app/setup-grader/grading.ts`: `15M FVG`, `1H FVG`, `4H FVG`).

---

## Reading the dashboard

A row is added below `Time Filter`:

```
HTF FVG Context:   REQUIRED    15m 1H 4H
```

`REQUIRED` (green) · `OFF` (grey, filter disabled) · `N/A` (orange — see *Edge cases*).

With `Show Filter Diagnostic?` on, a second section explains why a Unicorn did or didn't fire:

```
── FILTER DIAGNOSTIC ──
Unicorn Detected:  YES   BULL
HTF FVG Found:     YES   1H
Direction Match:   YES
FVG Interacted:    YES   12 bars ago
Delivery:          NO          Close Outside FVG
Final Signal:      NO
Blocked At:        DELIVERY
```

These are text rows on the table that already existed — no chart objects, no clutter when off.
The validating FVG is also appended to the setup label's tooltip.

---

## Non-repainting

| | |
|---|---|
| HTF FVG detection | Unchanged. `lookahead_on` with an offset of ≥1 bar reads only closed HTF bars — the standard non-repainting idiom, not a future leak. |
| Interaction | Reads `high`/`low`, which only ever widen within a bar, so it cannot flip back. Safe to evaluate live. |
| Delivery / invalidation | Read `close`, which does move intrabar, so both are gated on `barstate.isconfirmed`. |
| All filter flags | Latch `false → true` only. No past bar's decision can be rewritten. |

Historical and realtime agree **at bar close**, which is also when the Unicorn's own
`alert.freq_once_per_bar_close` fires. The only realtime difference is that a filtered setup now
appears at the close rather than flickering intrabar — strictly more conservative.

**Pre-existing** repaint characteristics of the Unicorn engine were not changed and are not fixed
here: its swing-level detection reads the forming HTF bar, and setup confirmation is evaluated
every tick rather than on `barstate.isconfirmed`.

---

## Two upstream behaviours that had to change

**1. FVG lifetime is no longer decided by a display setting.**
Upstream, `mitigated_show = false` (the default) made *any* mitigation event delete the FVG
outright. Setting `mitigated_type` to `Touched` would therefore destroy every FVG the instant
price tapped it, and no FVG could ever survive to validate a later Unicorn. The record is now
retained until it is genuinely invalidated — a **confirmed close through the far side** — which is
the filter's single authority. Changing `mitigated_type` now changes the display only, never the
signals. With the filter off, upstream behaviour is restored exactly.

*Consequence:* an FVG can be hidden (mitigated per your display setting) while still being
eligible for the filter — for example a bull FVG wicked through but never closed below. Set
`Mitigated` to visible in `HTF FVG — General` if you want to see them.

**2. `AddZone` no longer redraws retained FVGs.**
A direct consequence of (1): a retained-but-hidden FVG would otherwise have its lines recreated
every bar. Guarded.

---

## Edge cases

| Case | Behaviour |
|---|---|
| No HTF FVG at all | No signal |
| Opposite-direction FVG only | No signal — direction match fails |
| Multiple qualifying FVGs | Most recently interacted wins; named in the tooltip |
| FVG filled between delivery and Unicorn | Invalidation latches → no longer qualifies |
| FVG trimmed by the per-slot count | Signal lost. The slot's max count is the de-facto freshness ceiling. |
| **Chart TF at or above every filter TF** | The FVG engine cannot build those FVGs at all, so the filter **auto-bypasses** and the dashboard shows `N/A (no valid TF)` in orange. Failing loud beats going silently dead. |
| FVGs formed before the script loaded | Only tracked from the bar they are registered on — the filter cannot know about interactions that predate the FVG's own creation. |

---

## Performance

fadi's engine draws up to 4 lines + 1 linefill + 3 labels **per FVG**, and TradingView caps lines
and labels at 500 each. At the original defaults (6 slots × 20) the merged script would need
~480 lines and ~360 labels before the Unicorn's own drawings.

Per-slot FVG counts are therefore defaulted lower — **8 / 8 / 8 / 6 / 4 / 2** instead of
20/20/20/10/10/2 — for ~192 lines and ~144 labels. All still user-editable. If you raise them,
watch the object count.

`request.*` calls: 4 (Unicorn) + 18 (6 slots × 3) + 2 (ATR) = **24**, within Pine's limit of 40.

`max_bars_back = 5000` is set on the `indicator()` call, replacing the Unicorn's four
per-variable `max_bars_back(…, 1000)` calls — fadi's `findlow`/`findhigh` index up to 5000 bars
back and would throw at the lower value. If TradingView ever reports a memory error, lower it and
reduce the per-slot FVG counts together.

---

## Testing

Load the merged script and verify in this order. **Start with the regression tests** — they are
what prove the merge didn't disturb either engine.

**A. Regression (filter OFF)**
1. `Require HTF FVG Context? = false`, side by side with the original Unicorn Model → signals,
   boxes, labels, targets identical bar for bar.
2. Side by side with the original HTF FVG indicator, slot settings matched → FVG lines, fills, CE
   lines, labels and mitigation identical.
3. Cycle `mitigated_type` through all six options with the filter **on** → FVG display changes,
   the set of Unicorn signals does not.

**B. Filter correctness**
4. Every surviving signal shows a direction-matched HTF FVG on the chart.
5. Bullish Unicorn with only a bearish HTF FVG nearby → no signal, diagnostic reads `DIRECTION`.
6. Unicorn with no HTF FVG in range → filtered, diagnostic reads `NO HTF FVG`.
7. Price slicing straight through a gap → `Interacted: YES`, `Delivery: NO`, no signal.
   *This is the case that proves interaction ≠ delivery.*
8. Wick-in / close-out rejection candle that is also the breaker close-through bar → fires.
9. `Require Sweep Into FVG?` on, Unicorn whose sweep never reached the gap → filtered; off → fires.

**C. Non-repainting**
10. Record every signal over three sessions, reload the chart → identical set, identical bars.
11. Bar-replay through a live signal, reload, compare → same bar, same entry/invalidation/target.
12. Watch a live session: a signal appearing at bar close must never retract later.

**D. Multiplicity and stress**
13. Session with 3+ active same-direction HTF FVGs → tooltip names the most recently interacted.
14. Two Unicorns off one FVG → both fire; with `Consume FVG After Signal?` on, only the first.
15. Run on 1m / 5m / 15m / 1H / 4H. On 4H confirm the `N/A` auto-bypass.
16. Watch the Pine status line for object-limit or `max_bars_back` errors on a full history load.

**E. Alerts**
17. Activation alerts fire only for filtered signals, and `Potential Breaker` no longer
    pre-announces setups the filter would reject.

---

## Licence

Portions © fadizeidan, used under the Mozilla Public License 2.0
(<https://mozilla.org/MPL/2.0/>). The MPL header is retained at the top of the `.pine` file.
