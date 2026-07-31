import "./playbook.css";

const BODY_HTML = `
<div class="hero">
  <div class="hero-eyebrow">◈ STRATEGY MANUAL</div>
  <h1>The Unicorn Model Playbook</h1>
  <div class="hero-sub">ICT UNICORN MODEL · BREAKER BLOCK + FVG CONFLUENCE · NY AM KILLZONE</div>
  <div class="hero-p">This is the written strategy behind your live trade grader. Where the checklist scores a setup in real time, this playbook explains <em>why</em> each criterion exists and how it fits together. Read it once end to end, then keep the grader as your in-session tool.</div>
</div>

<div class="diagram-feature">
  <div class="diagram-feature-eyebrow">◈ Visual Reference</div>
  <h3 class="diagram-feature-title">Unicorn Model — Bearish vs. Bullish</h3>
  <div class="diagram-feature-img">
    <img src="/playbook/unicorn-model-bearish-bullish.jpg" alt="Unicorn Model diagram comparing a bearish and a bullish setup, marking the Unicorn zone, entry, stop loss below/above the Unicorn, and 2R take profit." />
  </div>
  <p class="diagram-feature-cap">The Unicorn zone (breaker + FVG overlap) on each side — entry inside the zone, stop beyond it, target at minimum 2R.</p>
</div>

<div class="toc">
  <div class="toc-hdr">◈ Contents</div>
  <div class="toc-grid">
    <a class="toc-item" href="#s1"><span class="toc-num">01</span>Foundations</a>
    <a class="toc-item" href="#s2"><span class="toc-num">02</span>Liquidity Mapping</a>
    <a class="toc-item" href="#s3"><span class="toc-num">03</span>OHLC Liquidity</a>
    <a class="toc-item" href="#s4"><span class="toc-num">04</span>Swing High/Low Liquidity</a>
    <a class="toc-item" href="#s5"><span class="toc-num">05</span>Breaker Blocks</a>
    <a class="toc-item" href="#s6"><span class="toc-num">06</span>Fair Value Gaps</a>
    <a class="toc-item" href="#s7"><span class="toc-num">07</span>Unicorn (Full Setup)</a>
    <a class="toc-item" href="#s8"><span class="toc-num">08</span>Entry and Execution</a>
    <a class="toc-item" href="#s9"><span class="toc-num">09</span>Invalidation Types</a>
    <a class="toc-item" href="#s10"><span class="toc-num">10</span>Trade Management</a>
  </div>
</div>

<div class="pnl" id="s1">
  <div class="phdr"><span class="pnum">01</span>Foundations</div>
  <div class="pbody">
    <p>Price moves to deliver on imbalance and to seek out liquidity. Every session is a hunt for the next pool of resting orders and the next inefficiency that needs to be filled. Your job isn't to predict direction from nothing — it's to read where price is delivering <em>from</em> and <em>to</em>, and only engage when structure, liquidity, and imbalance all point the same way at the same time.</p>
    <h4>Three Pillars</h4>
    <ul class="plist">
      <li><strong>Bias</strong> — the higher-timeframe direction price is expected to travel (Daily/4H context).</li>
      <li><strong>Liquidity</strong> — the resting stops and orders above old highs / below old lows that price is drawn to and sweeps before a real move happens.</li>
      <li><strong>Price delivery</strong> — how price actually gets from A to B: through structure shifts (breakers) and imbalances (FVGs), not straight lines.</li>
    </ul>
    <p>The Unicorn Model fuses these three ideas into one entry pattern: a liquidity sweep, followed by a structural shift (breaker block), with a Fair Value Gap sitting <em>inside</em> that breaker. That confluence — two independent signals occupying the same price real estate — is what makes it statistically stronger than trading a breaker or an FVG alone.</p>
    <h4>Operating Context</h4>
    <ul class="plist">
      <li>Instruments: NQ / ES futures</li>
      <li>Session: New York AM only, 9:30–12:00/12:15 EST</li>
      <li>Account structure: multiple funded prop accounts mirrored via trade copier — execution discipline matters at the portfolio level, not just per-trade, since one bad click replicates everywhere at once.</li>
    </ul>
  </div>
</div>

<div class="pnl" id="s2">
  <div class="phdr"><span class="pnum">02</span>Liquidity Mapping</div>
  <div class="pbody">
    <p>Before the open, you're mapping <strong>where the money is resting</strong> — not predicting where price goes. Liquidity clusters where retail stops sit: above recent highs, below recent lows, around prior reference points. Institutions need that liquidity to fill large orders, so price is statistically drawn toward it before reversing.</p>
    <h4>What You Map Every Morning</h4>
    <ul class="plist">
      <li>Prior day high/low (PDH/PDL)</li>
      <li>Overnight session high/low</li>
      <li>Data-driven highs/lows (news-reaction levels)</li>
      <li>Equal highs/equal lows (EQH/EQL) — the most obvious, most "engineered" liquidity</li>
      <li>Local relative liquidity (LRLR) from the immediate trend leg</li>
    </ul>
    <div class="note"><strong>Grader link →</strong> "Sweep of Major Liquidity" is a 5-point criterion for a reason — it's not optional confluence, it's the trigger that liquidity has been taken and price can now reverse or continue without needing more fuel from that pool.</div>
  </div>
</div>

<div class="pnl" id="s3">
  <div class="phdr"><span class="pnum">03</span>OHLC Liquidity</div>
  <div class="pbody">
    <p>Open, High, Low, and Close of any candle or session are liquidity reference points, not just chart decoration. Traders place stops relative to these levels constantly.</p>
    <ul class="plist">
      <li><strong>15M / 1H OHLC</strong> levels act as micro-liquidity pools that price sweeps on the way to bigger targets.</li>
      <li>The <strong>open</strong> of a session or candle often acts as a magnet — price reaching back to "true open" before continuing.</li>
      <li>The <strong>close</strong> of a strong displacement candle frequently becomes support/resistance on retest.</li>
    </ul>
    <p>Use these as <em>confirmation layers</em>, not primary bias — they tell you which liquidity was actually taken when your setup fires, sharpening the "Sweep of Major Liquidity" checkbox instead of leaving it a gut call.</p>
    <h4>Diagram Reference — OHLC / OLHC Sequencing</h4>
    <p class="ex-note">The order candles trade through their own Open/High/Low/Close determines which liquidity pattern you're looking at, and which direction it favors.</p>
    <div class="ex-grid">
      <div class="ex-card">
        <img src="/playbook/example-1.jpg" alt="OHLC Unicorn diagram">
        <div class="ex-tag">OHLC Unicorn</div>
        <div class="ex-cap">A displacement candle leaves an OHLC liquidity line resting beneath it. The next candle references that line — it's a resting liquidity level the same way a swing high or low is, just built from a single candle's own range instead of a multi-candle swing.</div>
      </div>
      <div class="ex-card">
        <img src="/playbook/example-2.jpg" alt="OHLC liquidity sequence diagram">
        <div class="ex-tag">OHLC Sequence</div>
        <div class="ex-cap">A higher-timeframe candle opens, trades up through the prior candle's high (sweeping that liquidity), then reverses down through the open and low before closing — an Open→High→Low→Close path that signals the sweep was a grab, not genuine continuation.</div>
      </div>
      <div class="ex-card">
        <img src="/playbook/example-3.jpg" alt="OLHC liquidity sequence diagram">
        <div class="ex-tag">OLHC Sequence</div>
        <div class="ex-cap">The mirror image: a higher-timeframe candle opens, trades down through the prior candle's low, then reverses up through the open and high before closing — an Open→Low→High→Close path, the bullish counterpart to the OHLC sequence above.</div>
      </div>
      <div class="ex-card">
        <img src="/playbook/example-4.jpg" alt="HTF to LTF timeframe alignment diagram">
        <div class="ex-tag">HTF → LTF Alignment</div>
        <div class="ex-cap">Identify the OHLC/OLHC liquidity level on a higher timeframe first, then drop down to a lower timeframe to actually execute — the same top-down timeframe discipline used everywhere else in the model (HTF bias → LTF entry).</div>
      </div>
    </div>
  </div>
</div>

<div class="pnl" id="s4">
  <div class="phdr"><span class="pnum">04</span>Swing High/Low Liquidity</div>
  <div class="pbody">
    <p>Swing highs and lows are the clearest, most textbook liquidity. Every 15M/1H swing point price has reacted from is a level with resting orders behind it.</p>
    <h4>The Mechanic</h4>
    <ol class="plist num">
      <li>Price approaches a swing high or low.</li>
      <li>Instead of cleanly breaking and continuing, price <strong>wicks through and fails to hold</strong> — the "lightbulb moment": when price doesn't displace above/below liquidity.</li>
      <li>That failure to hold is your first tell the swing point was a liquidity grab, not real directional intent.</li>
    </ol>
    <p>This is the seed of your Breaker Block — a breaker cannot exist without a swing liquidity sweep first. Swing liquidity identification isn't a separate skill from breaker trading; it's step one of it.</p>
  </div>
</div>

<div class="pnl" id="s5">
  <div class="phdr"><span class="pnum">05</span>Breaker Blocks</div>
  <div class="pbody">
    <p><strong>Definition:</strong> a Breaker Block is a former order block that gets swept and broken, then flips polarity — the level that used to fail now becomes the level that holds.</p>
    <h4>Bullish Sequence</h4>
    <p>Low → High → Lower Low (sweeps below the low) → Higher High (reverses and breaks structure). The candle(s) that made the lower low become your bullish breaker.</p>
    <h4>Bearish Sequence</h4>
    <p>High → Low → Higher High (sweeps above the high) → Lower Low (reverses and breaks structure down). The candle(s) that made the higher high become your bearish breaker.</p>
    <h4>What Makes It Valid — Not Just Present</h4>
    <ul class="plist">
      <li>The swept swing must be a real liquidity point (major, not noise).</li>
      <li>There must be a genuine <strong>Market Structure Shift (MSS)</strong> — an aggressive break of the opposing structure.</li>
      <li>The break must come with <strong>displacement</strong> — strong, wide-range candles, not a grind.</li>
    </ul>
    <p>A breaker without displacement is a shape on a chart. A breaker with displacement is evidence of institutional aggression behind the move — which is why displacement is inseparable from the breaker itself.</p>
    <div class="sec-img">
      <img src="/playbook/breaker-block-bullish-bearish.jpg" alt="Breaker Block diagram comparing a bullish +BB setup (left, acting as support) and a bearish -BB setup (right, acting as resistance) on candlestick charts." />
    </div>
    <p class="sec-cap"><strong>A bullish breaker</strong> (left) is the last down-close candle or series of down-close candles before a bearish move that breaks a low and then reverses bullish — that candle becomes support when price returns. <strong>A bearish breaker</strong> (right) is the last up-close candle or series of up-close candles before a bullish move that breaks a high and then reverses bearish — that candle becomes resistance when price returns.</p>
  </div>
</div>

<div class="pnl" id="s6">
  <div class="phdr"><span class="pnum">06</span>Fair Value Gaps</div>
  <div class="pbody">
    <p><strong>Definition:</strong> an FVG is the three-candle imbalance where the high of candle 1 doesn't overlap the low of candle 3 (bullish) or the low of candle 1 doesn't overlap the high of candle 3 (bearish). It represents inefficient price delivery — a gap the market has a statistical tendency to return to before continuing.</p>
    <h4>Standalone vs. Inside a Breaker</h4>
    <p>An FVG floating on its own is one signal. A breaker block on its own is a second, independent signal. When the FVG's price range sits <em>inside</em> the breaker's price range, two unrelated concepts agree on the exact same zone — that overlap is rare and strong enough to earn its own name: the Unicorn.</p>
    <div class="note"><strong>HTF FVG delivery (4 pts) →</strong> beyond the entry-timeframe FVG, you want price arriving from a higher-timeframe FVG (15M/1H/4H) too — confirmation the move is part of a larger institutional order-flow story, not just a local reaction.</div>
  </div>
</div>

<div class="pnl" id="s7">
  <div class="phdr"><span class="pnum">07</span>Unicorn — Full Setup</div>
  <div class="pbody">
    <p>This is where everything above fuses into one tradable pattern.</p>
    <div class="seq">
      <div class="seq-chip"><span class="sn">1</span>HTF bias</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">2</span>Clear DOL (2R+)</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">3</span>Liquidity swept</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">4</span>MSS + displacement</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">5</span>Breaker forms</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">6</span>FVG overlaps breaker</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">7</span>HTF PD array align</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">8</span>Premium/discount check</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">9</span>Not extended 2R+</div><div class="seq-arrow">→</div>
      <div class="seq-chip"><span class="sn">10</span>Retrace entry</div>
    </div>
    <p style="margin-top:12px;"><strong>A Unicorn is not "an FVG" or "a breaker."</strong> It's the specific, rare condition where both exist on top of each other. If they don't share the same price range, it's a lesser, lower-confluence setup — and the grade should reflect that.</p>
  </div>
</div>

<div class="pnl">
  <div class="phdr red"><span class="pnum">EX</span>Example — Bearish Unicorn (NQ1! · 1m · June 23)</div>
  <div class="pbody">
    <p class="ex-note">Live chart walkthrough of a full bearish Unicorn cycle: setup identification, HTF FVG context, and target reached at 2R.</p>
    <div class="ex-grid">
      <div class="ex-card">
        <img src="/playbook/example-5.jpg" alt="Bearish Unicorn setup identification">
        <div class="ex-tag">01 · Setup Identification</div>
        <div class="ex-cap">Entry at the low of the Unicorn zone, stop placed on the opposite side of the range. Alert: <em>Potential 1m Bearish Unicorn [15m OHLC]</em>.</div>
      </div>
      <div class="ex-card">
        <img src="/playbook/example-6.jpg" alt="Bearish Unicorn HTF FVG context">
        <div class="ex-tag">02 · HTF PD Array Context</div>
        <div class="ex-cap">1H chart showing price trading through an hourly Fair Value Gap — confirmation the move is backed by higher-timeframe order flow, not just a local reaction.</div>
      </div>
      <div class="ex-card">
        <img src="/playbook/example-7.jpg" alt="Bearish Unicorn 1R/2R projections">
        <div class="ex-tag">03 · Risk Projection</div>
        <div class="ex-cap">1R and 2R levels projected automatically from the Unicorn zone once the setup confirms — the distance being managed toward before any target is hit.</div>
      </div>
      <div class="ex-card">
        <img src="/playbook/example-8.jpg" alt="Bearish Unicorn target reached at 2R">
        <div class="ex-tag">04 · Target Reached</div>
        <div class="ex-cap">2R target hit via automatic projections. Alert: <em>Target Reached — 1m Bearish Unicorn [15m OHLC]</em>. This is the extension window from §10 — note price kept running past this print on the raw chart, which is exactly the 3R behavior the trade-management refinements are built to capture.</div>
      </div>
    </div>
  </div>
</div>

<div class="pnl">
  <div class="phdr green"><span class="pnum">EX</span>Example — Bullish Unicorn (NQ1! · 1m · June 15)</div>
  <div class="pbody">
    <p class="ex-note">Live chart walkthrough of a full bullish Unicorn cycle: HTF FVG context, then entry, stop, and 2R take-profit on the entry timeframe.</p>
    <div class="ex-grid">
      <div class="ex-card">
        <img src="/playbook/example-9.jpg" alt="Bullish Unicorn HTF FVG context">
        <div class="ex-tag">01 · HTF PD Array Context</div>
        <div class="ex-cap">15-minute chart showing the higher-timeframe positive FVG (HTF +FVG) price is delivering from, sitting directly above the entry-timeframe Unicorn zone.</div>
      </div>
      <div class="ex-card">
        <img src="/playbook/example-10.jpg" alt="Bullish Unicorn entry, stop, and 2R take profit">
        <div class="ex-tag">02 · Entry, Stop, and Target</div>
        <div class="ex-cap">Entry at the Unicorn zone, stop loss placed below it, 2R take-profit reached on the run higher. Same mechanics as the bearish example, mirrored for a long.</div>
      </div>
    </div>
  </div>
</div>

<div class="pnl" id="s8">
  <div class="phdr"><span class="pnum">08</span>Entry and Execution</div>
  <div class="pbody">
    <h4>Killzone</h4>
    <p>NY AM session, 9:30–12:00/12:15 EST. Outside this window you are not trading — full stop, regardless of how good a setup looks.</p>
    <h4>Macro Windows (Confluence, Not Mandatory)</h4>
    <p>9:45–10:15 · 10:45–11:15 · 11:45–12:15. A Unicorn confirming inside one of these carries extra weight (+3), but its absence doesn't invalidate an otherwise A/A+ setup.</p>
    <h4>Entry Mechanics</h4>
    <ol class="plist num">
      <li>Wait for price to retrace into the Unicorn zone (breaker/FVG overlap) — never chase the initial displacement leg.</li>
      <li>Confirm the Unicorn indicator alert as <em>confirmation</em>, not a trigger — don't force setups without it, but don't let it replace your own read of the criteria.</li>
      <li>Grade the setup live. <strong>B grade (≥65%) is your hard floor.</strong> Below that, you are not in the trade regardless of how the story "feels."</li>
      <li>Breaker Block w/ Displacement is a <strong>mandatory knockout</strong> — worth 0 points but blocks entry entirely if unchecked.</li>
      <li>Stop-loss beyond the breaker/FVG zone — structurally invalidated if price closes back through it.</li>
      <li>Target minimum 2R, ideally your identified DOL. Recent backtest data shows a meaningful share of winners run to 3R+ — flagged as the #1 refinement area (see §10).</li>
    </ol>
    <div class="callout"><strong>⚠ Mandatory Knockout</strong>Breaker Block w/ Displacement (FVG) must be confirmed before any entry. No exceptions, no partial credit.</div>
    <h4>Grade → Risk Sizing</h4>
    <table class="gtbl">
      <tr><th>Grade</th><th>Threshold</th><th>Risk % of Acct</th><th>Action</th></tr>
      <tr><td class="gl gaplus">A+</td><td>≥90%</td><td>0.40% (max)</td><td>Execute — prime setup, size within rules</td></tr>
      <tr><td class="gl ga">A</td><td>≥80%</td><td>0.35%</td><td>Strong entry, normal size</td></tr>
      <tr><td class="gl gb">B</td><td>≥65%</td><td>0.25%</td><td>Minimum acceptable — reduce size, tight management</td></tr>
      <tr><td class="gl gc">C</td><td>≥50%</td><td>No trade</td><td>Stand aside — missing key confluence</td></tr>
      <tr><td class="gl gd">D</td><td>≥35%</td><td>No trade</td><td>Weak — stay flat</td></tr>
      <tr><td class="gl gf">F</td><td>&lt;35%</td><td>No trade</td><td>Does not qualify</td></tr>
    </table>
  </div>
</div>

<div class="pnl" id="s9">
  <div class="phdr"><span class="pnum">09</span>Invalidation Types</div>
  <div class="pbody">
    <p>Know these before you're in the trade, not after.</p>
    <h4>Breaker Invalidation</h4>
    <p>Price closes decisively past the far side of the breaker block. The zone that was supposed to hold has failed — any position built on it should already be stopped out structurally.</p>
    <h4>Swing Invalidation</h4>
    <p>The liquidity sweep that started the sequence gets violated in the <em>other</em> direction — price takes out the opposing swing point before your setup can play out, telling you the original read on bias or structure was wrong.</p>
    <h4>Other Triggers</h4>
    <ul class="plist">
      <li>Setup already extended 2R+ from the breaker before entry — the move is stale.</li>
      <li>No genuine displacement through the breaker, even if price technically closed past it.</li>
      <li>FVG and breaker don't share price range — a look-alike, not a real Unicorn.</li>
      <li>Trading outside the 9:30–12:00/12:15 window.</li>
      <li>News-day restrictions: no trades on CPI, FOMC, NFP, or the day before.</li>
      <li>200+ point expansion already in session — the easy liquidity has likely already been taken.</li>
    </ul>
    <h4>Discipline Layer (Non-Negotiable)</h4>
    <ul class="plist warn">
      <li>Lose one trade → done for the day.</li>
      <li>Win one trade → walk away. Don't try to run it back.</li>
      <li>No impulse trades — every criterion must be present before entry, not "most of them."</li>
    </ul>
    <div class="note">These rules exist precisely <em>because</em> you're running a copier across multiple funded accounts. One impulsive entry isn't one mistake — it's simultaneous exposure across every account it mirrors to. Treat discipline as portfolio-level risk management, not just single-trade risk management.</div>
  </div>
</div>

<div class="pnl" id="s10">
  <div class="phdr"><span class="pnum">10</span>Trade Management and Break-Even Criteria</div>
  <div class="pbody">
    <p>This is currently the highest-leverage area for improvement, based on the last 50-trade backtest (Feb–Jul 2026).</p>
    <h4>What the Data Says</h4>
    <ul class="plist">
      <li>A significant share of winners extend well past the standard 2R exit — commonly reaching 3R before reversing. Exiting flat at 2R every time leaves measurable edge on the table.</li>
      <li>Thursday has been the consistently strongest day — worth a mental note on size/conviction, not a hard rule to trade only Thursdays.</li>
      <li>Trades aligned with a <strong>bearish</strong> HTF bias have outperformed bullish-bias trades recently — worth watching as sample size grows rather than treated as settled.</li>
      <li><strong>Session Liquidity</strong> as a DOL target has been the weakest-performing category — deprioritize versus ITH/ITL, IRL (FVG), or PDH/PDL.</li>
      <li>Counter-trend trades (against HTF bias) are underperforming — a candidate for filtering out at the checklist level.</li>
    </ul>
    <h4>Recommended Refinements to Test Forward</h4>
    <ol class="plist num">
      <li><strong>Partial-profit / trail structure instead of a flat 2R exit.</strong> Take partial size off at 2R to lock in the win, move stop to breakeven, and trail the remainder toward 3R using 15M/5M structure as the trailing reference.</li>
      <li><strong>Break-even trigger:</strong> once price reaches 1R in favor <em>with</em> the next FVG or swing point behind it as confirmation — not a fixed tick count that ignores volatility context.</li>
      <li><strong>DOL selection filter:</strong> weight ITH/ITL, IRL (FVG), and PDH/PDL above Session H/L given the current performance gap.</li>
      <li><strong>Bias filter:</strong> flag counter-trend Unicorn setups for smaller size or exclusion until more data confirms or disproves the underperformance.</li>
    </ol>
    <div class="callout" style="border-color:var(--gold);background:rgba(255,215,0,.06);border-left-color:var(--gold);color:var(--gold);">
      <strong>⚠ Test Before Scaling</strong>A structural change to exits affects every mirrored copier account simultaneously. Validate the new partial/trail structure on paper or one account first before rolling it across all funded accounts.
    </div>
  </div>
</div>

<div class="pnl">
  <div class="phdr gold">⚡ One-Page Summary</div>
  <div class="pbody">
    <div class="sumgrid">
      <div class="sum-block">
        <h5>Setup Requirements, In Order</h5>
        <p style="font-family:var(--font-share-tech-mono),monospace;font-size:11px;color:var(--text-dim);line-height:1.7;">HTF bias → clear DOL (2R+ away) → major liquidity swept → MSS with displacement → breaker forms → FVG overlaps breaker (Unicorn confirmed) → HTF PD array alignment → correct side of premium/discount → not already extended 2R+ → retrace entry into the zone.</p>
      </div>
      <div class="sum-block">
        <h5>Non-Negotiables</h5>
        <ul class="rul">
          <li class="warn">Breaker + Displacement + FVG = mandatory, zero exceptions</li>
          <li>B grade (65%) minimum to enter</li>
          <li>9:30–12:00/12:15 EST only</li>
          <li class="warn">One loss = done for the day. One win = walk away.</li>
          <li class="warn">No CPI / FOMC / NFP / day-before trades</li>
        </ul>
      </div>
      <div class="sum-block">
        <h5>Current Refinement Priorities</h5>
        <ol class="plist num">
          <li>Build a partial-profit/trail structure to capture the 3R extensions currently left on the table.</li>
          <li>De-prioritize Session Liquidity as a DOL target.</li>
          <li>Filter or downsize counter-trend (against-HTF-bias) trades.</li>
          <li>Keep monitoring whether bearish-bias outperformance and Thursday strength hold as sample size grows — don't overfit to 50 trades yet.</li>
        </ol>
      </div>
    </div>
  </div>
</div>

<div class="ftr">🦄 UNICORN PLAYBOOK · NY AM SESSION · COMPANION TO YOUR TRADE GRADER</div>
`;

export function UnicornPlaybook() {
  return (
    <div className="unicorn-playbook">
      <div className="app">
        <div className="hdr">
          <div className="logo">
            🦄 UNICORN <span>PLAYBOOK</span>
          </div>
          <div className="hdr-mid">NQ / ES · NY AM SESSION</div>
        </div>
        <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />
      </div>
    </div>
  );
}
