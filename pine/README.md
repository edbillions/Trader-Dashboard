# Pine Scripts

## `Unicorn_Model_HTF_FVG.pine`

The Unicorn Model with a Higher-Timeframe FVG context filter layered around it.

A Unicorn becomes **qualified** when, in this order:

1. a HTF FVG exists (built by the Multi-Timeframe FVG engine),
2. price taps it,
3. the Unicorn Model confirms a **same-direction** Unicorn,
4. all within the configured interaction window.

### Design constraint

The Unicorn Model is treated as an immutable engine. The FVG layer reads the
Unicorn's verdict; it never gates, alters or re-derives it. Exactly **one** line
of the original Unicorn script is different in the merged file — the
`indicator()` declaration. Everything else is byte-identical, with new code only
ever appended around it.

`Only Show Qualified Setups?` does not weaken that. Setups are still confirmed on
exactly the same bars under exactly the same conditions, and the pending sweep
leg is still consumed by them; an unqualified one is discarded *after* the fact,
using the same cleanup the engine's own history-limit and discard-invalidated
paths perform. One consequence to know about: the engine's "Activation" alert
still fires for a setup this mode hides, because suppressing it would mean
editing locked Unicorn code. Use the **Qualified Bullish/Bearish Unicorn** alerts
instead when filtering.

With **Enable HTF FVG Context?** off, the script is the original Unicorn Model:
no FVG zones, no FVG state, no extra `alert()` calls, no qualified markers, and
an unchanged dashboard. (The two FVG `alertcondition` entries still appear in
TradingView's alert dropdown, since `alertcondition` cannot be declared
conditionally — but they can never fire while the layer is off.)

### Settings that matter

| Setting | Notes |
|---|---|
| `Enable HTF FVG Context?` | Master switch. Off = original Unicorn Model. |
| `Only Show Qualified Setups?` | **On by default.** A confirmed setup with no same-direction HTF FVG tap behind it is removed from the chart along with its drawings. Turn off for the purely additive behaviour: every setup stays visible and qualified ones are merely marked. |
| `Interaction Window (bars)` | Chart bars a tap keeps qualifying for. `0` = same bar only. |
| `Show HTF FVG Zones?` | Off keeps qualification working with no boxes drawn — useful for a clean chart and it leaves the shared 500-box budget to the Unicorn. |
| `Wait for candle close to identify FVG ?` | Leave **on**. Off is the FVG engine's live mode, which repaints by design and would make qualification repaint with it. |
| `Max bars back to find FVGs ?` | Qualification cannot reach further back than this, because no gaps are built beyond it. |

Multiple active FVGs are supported: any tracked gap can supply the tap, and the
qualifying state is one slot per direction. Qualification is a property of the
Unicorn rather than of a gap, so a Unicorn can never be qualified twice however
many gaps were tapped. When several gaps are tapped on the same bar, the newest
one's timeframe is the one reported on the dashboard.

### Non-repainting

- The FVG engine's confirmed path uses `lookahead_on` with offsets ≥ 1 — the
  standard non-repainting idiom, reading only closed HTF candles. Gaps are
  detected on the close of their third candle, the earliest causally valid moment.
- Qualification is `bar_index` arithmetic over state that can only be written on
  the bar a tap occurred, so a later tap cannot retroactively qualify an earlier
  Unicorn.
- Markers are `plotshape`/`plotchar`, fixed to their own bar.

## `reference/`

Untouched copies of the two source indicators (CRLF normalized to LF), kept so
the "the Unicorn engine did not change" claim stays mechanically checkable:

```bash
# Unicorn lines missing from the merged file — expect only the indicator() line
awk 'NR==FNR{a[$0]=1;next} !($0 in a) && $0 !~ /^[[:space:]]*$/' \
  pine/Unicorn_Model_HTF_FVG.pine pine/reference/Unicorn_Model_original.pine

# FVG lines missing from the merged file — expect only the indicator() line,
# the five renamed input-group labels, and the handful of lines re-indented by
# the enableHtfFvg / showFvgZones / alertFvgTap guards
awk 'NR==FNR{a[$0]=1;next} !($0 in a) && $0 !~ /^[[:space:]]*$/' \
  pine/Unicorn_Model_HTF_FVG.pine pine/reference/FVG_MultiTimeframe_original.pine
```

There is no local Pine compiler — compilation is verified by pasting the script
into the TradingView Pine Editor.
