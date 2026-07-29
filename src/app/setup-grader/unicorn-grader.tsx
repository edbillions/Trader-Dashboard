"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./grader.css";
import {
  CRITERIA_WEIGHTS,
  CRITERION_KEYS,
  CRITERION_TO_CONFLUENCE_LABEL,
  DOL_TARGET_LABELS,
  HTFPD_LEVEL_LABELS,
  KNOCKOUT_KEYS,
  LIQ_SWEPT_LABELS,
  RISK_COLOR_CLASS,
  RISK_PCT,
  TOTAL_POINTS,
  gradeFor,
  type CriterionKey,
} from "./grading";

type CheckedState = Record<CriterionKey, boolean>;

const EMPTY_CHECKED: CheckedState = CRITERION_KEYS.reduce((acc, k) => {
  acc[k] = false;
  return acc;
}, {} as CheckedState);

function fmtDollars(n: number) {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function UnicornGrader() {
  const router = useRouter();
  const [checked, setChecked] = useState<CheckedState>(EMPTY_CHECKED);
  const [alertChecked, setAlertChecked] = useState(false);
  const [killzoneOn, setKillzoneOn] = useState(false);
  const [dolTarget, setDolTarget] = useState<string | null>(null);
  const [htfpdLevel, setHtfpdLevel] = useState<string | null>(null);
  const [liqSwept, setLiqSwept] = useState<Set<string>>(new Set());
  const [account, setAccount] = useState(50000);
  const [accountInput, setAccountInput] = useState("50,000");

  function toggle(key: CriterionKey) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }

  function toggleLiq(key: string) {
    setLiqSwept((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const { earned, checkedCount, koBlocked, grade, pct } = useMemo(() => {
    let e = 0;
    let n = 0;
    for (const k of CRITERION_KEYS) {
      if (checked[k]) {
        n++;
        if (CRITERIA_WEIGHTS[k] > 0) e += CRITERIA_WEIGHTS[k];
      }
    }
    if (alertChecked) n++;
    const bbOk = checked.bb;
    const blocked = !bbOk && n > 0;
    const p = e / TOTAL_POINTS;
    return { earned: e, checkedCount: n, koBlocked: blocked, grade: gradeFor(p), pct: p };
  }, [checked, alertChecked]);

  const hasAnyChecked = checkedCount > 0;
  const canTrade = !koBlocked && hasAnyChecked && RISK_PCT[grade.letter] !== undefined;
  const riskPct = canTrade ? RISK_PCT[grade.letter] : null;
  const riskDollars = riskPct != null ? account * (riskPct / 100) : null;

  function resetAll() {
    setChecked(EMPTY_CHECKED);
    setAlertChecked(false);
    setKillzoneOn(false);
    setDolTarget(null);
    setHtfpdLevel(null);
    setLiqSwept(new Set());
  }

  function sendToJournal() {
    const confluenceLabels = CRITERION_KEYS.filter(
      (k) => checked[k] && CRITERION_TO_CONFLUENCE_LABEL[k],
    ).map((k) => CRITERION_TO_CONFLUENCE_LABEL[k]!);

    sessionStorage.setItem(
      "unicorn-grader-handoff",
      JSON.stringify({
        entryModel: "Unicorn Model",
        setupGrade: grade.letter,
        confluenceFactorLabels: confluenceLabels,
      }),
    );
    router.push("/journal/new");
  }

  return (
    <div className="unicorn-grader">
      <div className="hdr">
        <div className="logo">
          🦄 UNICORN <span>TRADING</span>
        </div>
        <div className="hdr-mid">INTRADAY SETUP GRADER · NY SESSION</div>
        <div className="hdr-right">
          <div className="date-d">
            {new Date()
              .toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase()}
          </div>
        </div>
      </div>

      <div className={`ko-banner${koBlocked ? " visible" : ""}`}>
        <div className="ko-icon">🚫</div>
        <div>
          <div className="ko-text">NO TRADE — KNOCKOUT CONDITION ACTIVE</div>
          <div className="ko-sub">
            Breaker Block w/ Displacement (FVG) must be confirmed before any
            entry.
          </div>
        </div>
      </div>

      <div className={`gbar${koBlocked ? " blocked" : ""}`}>
        <div className="gbox">
          <div className="glbl">GRADE</div>
          <div className={`gbig ${grade.colorClass}`}>
            {earned > 0 ? grade.letter : "—"}
          </div>
          <div className="gpts">
            {earned} / {TOTAL_POINTS} pts
          </div>
        </div>
        <div className="vwrap">
          <div className={`vmain ${koBlocked || earned === 0 ? "cf" : grade.colorClass}`}>
            {koBlocked
              ? "🚫 NO TRADE — KNOCKOUT ACTIVE"
              : earned === 0
                ? "AWAITING CRITERIA"
                : grade.verdict}
          </div>
          <div className="vsub">
            {koBlocked
              ? "Breaker Block w/ Displacement (FVG) must be confirmed. Grade is overridden until checked."
              : earned === 0
                ? "Check off criteria as your setup confirms. Min B grade required for entry."
                : grade.subtext}
          </div>
          <div className="pbar-wrap">
            <div
              className="pbar-fill"
              style={{
                width: `${(pct * 100).toFixed(1)}%`,
                background: koBlocked ? "var(--red)" : earned === 0 ? "var(--g-f)" : grade.barColorVar,
              }}
            />
          </div>
          <div className="thrs">
            <div className="thr">
              <div className="tdot" style={{ background: "var(--g-aplus)" }} />
              A+≥90%
            </div>
            <div className="thr">
              <div className="tdot" style={{ background: "var(--g-a)" }} />
              A≥80%
            </div>
            <div className="thr">
              <div className="tdot" style={{ background: "var(--g-b)" }} />
              B≥65%
            </div>
            <div className="thr">
              <div className="tdot" style={{ background: "var(--g-c)" }} />
              C≥50%
            </div>
            <div className="thr">
              <div className="tdot" style={{ background: "var(--g-d)" }} />
              D≥35%
            </div>
            <div className="thr">
              <div className="tdot" style={{ background: "var(--g-f)" }} />
              F&lt;35%
            </div>
          </div>
        </div>
        <div className="ract">
          <button className="rst-btn" onClick={resetAll}>
            ⟳ RESET
          </button>
          <div className="tot-sm">
            SCORE: <span style={{ color: "var(--accent)" }}>{earned}</span>/
            {TOTAL_POINTS}
          </div>
        </div>
      </div>

      <div className="mgrid">
        <div className="lcol">
          <table className="cht">
            <colgroup>
              <col style={{ width: 138 }} />
              <col style={{ width: 26 }} />
              <col />
              <col style={{ width: 34 }} />
            </colgroup>
            <tbody>
              <tr className="chdr">
                <td>CRITERIA</td>
                <td style={{ textAlign: "center" }}>✔</td>
                <td>NOTES / EXPLANATION</td>
                <td style={{ textAlign: "center" }}>WT</td>
              </tr>

              <tr className="kzr">
                <td colSpan={4}>
                  <div className="kzi">
                    <div className="kzlbl">⚡ KILLZONE</div>
                    <div
                      className={`kztog${killzoneOn ? " on" : ""}`}
                      onClick={() => setKillzoneOn((v) => !v)}
                    />
                    <div className="kzsn">NY AM Session</div>
                    <div className="kztm">9:30 AM – 12:15 PM EST</div>
                  </div>
                </td>
              </tr>

              <tr className="sr">
                <td colSpan={4}>◈ BIAS &amp; DOL (HTF – 1D / 4H)</td>
              </tr>

              <Criterion
                label="Bias Confirmed"
                note="Determine bias from price location in range OR IRL/ERL. Where is price delivering from?"
                example="→ Use Daily, 4H, 15M chart"
                weightClass="w5"
                weightLabel="5"
                checkedVal={checked.bias}
                onToggle={() => toggle("bias")}
              />

              <tr className={`cr${checked.dol ? " chk" : ""}`}>
                <td className="crn">Clear DOL Identified</td>
                <td className="crc">
                  <Checkbox checked={checked.dol} onChange={() => toggle("dol")} />
                </td>
                <td>
                  <div className="crnt">
                    Select the liquidity level you are targeting:
                  </div>
                  <div className="crex">→ Target 2R minimum</div>
                  <div className="sub-panel">
                    <div className="sub-panel-lbl">▸ Targeting</div>
                    <div className="sub-grid">
                      {Object.entries(DOL_TARGET_LABELS).map(([key, label]) => (
                        <label key={key} className="sub-dol-item">
                          <input
                            type="radio"
                            name="dol-target"
                            checked={dolTarget === key}
                            onChange={() => setDolTarget(key)}
                          />
                          <span className="sub-rbv" />
                          <span className="sub-item-lbl">{label}</span>
                        </label>
                      ))}
                    </div>
                    {dolTarget && (
                      <div className="sub-dol-selected">
                        ▸ TARGET: {DOL_TARGET_LABELS[dolTarget]}
                      </div>
                    )}
                  </div>
                </td>
                <td className="crw w5">5</td>
              </tr>

              <tr className="sr">
                <td colSpan={4}>◈ STRUCTURE &amp; PD ARRAYS (1H / 15M)</td>
              </tr>

              <tr className={`cr${checked.liq ? " chk" : ""}`}>
                <td className="crn">Sweep of Major Liquidity</td>
                <td className="crc">
                  <Checkbox checked={checked.liq} onChange={() => toggle("liq")} />
                </td>
                <td>
                  <div className="crnt">Select which liquidity has been swept:</div>
                  <div className="crex">
                    → When price doesn&apos;t displace above/below liq —
                    lightbulb moment!
                  </div>
                  <div className="sub-panel">
                    <div className="sub-panel-lbl">▸ Swept / Tagged</div>
                    <div className="sub-grid">
                      {Object.entries(LIQ_SWEPT_LABELS).map(([key, label]) => (
                        <label key={key} className="sub-item">
                          <input
                            type="checkbox"
                            checked={liqSwept.has(key)}
                            onChange={() => toggleLiq(key)}
                          />
                          <span className="sub-cbv" />
                          <span className="sub-item-lbl">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="crw w5">5</td>
              </tr>

              <tr className={`cr${checked.htfpd ? " chk" : ""}`}>
                <td className="crn">HTF Delivery From PD Array (FVG)</td>
                <td className="crc">
                  <Checkbox checked={checked.htfpd} onChange={() => toggle("htfpd")} />
                </td>
                <td>
                  <div className="crnt">
                    Price delivering from a higher timeframe FVG:
                  </div>
                  <div className="crex">
                    → Confirms institutional order flow into entry
                  </div>
                  <div className="sub-panel">
                    <div className="sub-panel-lbl">▸ HTF FVG Level</div>
                    <div className="sub-grid">
                      {Object.entries(HTFPD_LEVEL_LABELS).map(([key, label]) => (
                        <label key={key} className="sub-dol-item">
                          <input
                            type="radio"
                            name="htfpd-level"
                            checked={htfpdLevel === key}
                            onChange={() => setHtfpdLevel(key)}
                          />
                          <span className="sub-rbv" />
                          <span className="sub-item-lbl">{label}</span>
                        </label>
                      ))}
                    </div>
                    {htfpdLevel && (
                      <div className="sub-dol-selected">
                        ▸ LEVEL: {HTFPD_LEVEL_LABELS[htfpdLevel]}
                      </div>
                    )}
                  </div>
                </td>
                <td className="crw w4">4</td>
              </tr>

              <Criterion
                label="Right Side of Premium / Discount"
                note="Determined using daily range indicator or FIB."
                example="→ Long in discount · Sell in premium · Avoid breakout setups"
                weightClass="w2"
                weightLabel="2"
                checkedVal={checked.pd}
                onToggle={() => toggle("pd")}
              />

              <tr className="sr">
                <td colSpan={4}>◈ UNICORN FORMATION (5M / 1M / 15M)</td>
              </tr>

              <tr className={`cr ko-row${checked.bb ? " chk" : ""}`}>
                <td className="crn">Breaker Block w/ Displacement (FVG)</td>
                <td className="crc">
                  <Checkbox checked={checked.bb} onChange={() => toggle("bb")} />
                </td>
                <td>
                  <div className="crnt">
                    Valid Breaker Block (ISPs confirmed) + Displacement
                    through it with aligned FVG.
                  </div>
                  <div className="crex">
                    → Highest/lowest closed candle(s) before liq taken · Must
                    displace through with FVG
                  </div>
                  <div
                    style={{
                      padding: "2px 8px 3px",
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: 8,
                      color: "var(--red)",
                      letterSpacing: ".5px",
                    }}
                  >
                    ⚠ KNOCKOUT — No trade without both
                  </div>
                </td>
                <td className="crw wko">KO</td>
              </tr>

              <Criterion
                label="Price NOT at 2R / 2 StdDev"
                note="No trades if setup has already gone 2R from the breaker."
                example="→ Confirm the move is still fresh"
                weightClass="w5"
                weightLabel="5"
                checkedVal={checked["2r"]}
                onToggle={() => toggle("2r")}
              />

              <tr className="sr">
                <td colSpan={4}>◈ CONFLUENCES</td>
              </tr>

              <Criterion
                label="Macro Window"
                note="9:45–10:15 am · 10:45–11:15 am · 11:45–12:15 pm"
                example="→ Not mandatory but adds significant confluence"
                weightClass="w3"
                weightLabel="3"
                checkedVal={checked.macro}
                onToggle={() => toggle("macro")}
              />

              <tr className={`cr${alertChecked ? " chk" : ""}`}>
                <td className="crn">🦄 Unicorn Indicator Alerted</td>
                <td className="crc">
                  <Checkbox checked={alertChecked} onChange={() => setAlertChecked((v) => !v)} />
                </td>
                <td>
                  <div className="crnt">
                    Did the Unicorn indicator fire an alert on this setup?
                  </div>
                  <div className="crex">
                    → Confirmation only — do not force setups without it
                  </div>
                </td>
                <td
                  className="crw"
                  style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: 7,
                    color: "var(--text-dim)",
                    letterSpacing: ".5px",
                    textAlign: "center",
                  }}
                >
                  —
                </td>
              </tr>

              <tr className="totr">
                <td colSpan={2}>
                  TOTAL ✔ <span className="tv">{checkedCount}</span>
                </td>
                <td style={{ fontSize: 9, padding: "4px 8px" }}>
                  At least B grade required · Breaker Block w/ Displacement =
                  mandatory KO
                </td>
                <td style={{ textAlign: "center" }} className="tv">
                  {earned}
                </td>
              </tr>
            </tbody>
          </table>

          <div className={`rsk${canTrade ? " active" : ""}${koBlocked || (!canTrade && hasAnyChecked) ? " blocked-risk" : ""}`}>
            <div className="rsk-hdr">
              <span>💰 DYNAMIC RISK CALCULATOR</span>
              <span className="rsk-hdr-right">MAX 0.40% / TRADE</span>
            </div>
            {!hasAnyChecked ? (
              <div className="rsk-body">
                <AccountInput
                  value={accountInput}
                  onChange={(raw, num) => {
                    setAccountInput(raw);
                    setAccount(num);
                  }}
                />
                <div className="rsk-main">
                  <div className="rsk-card">
                    <div className="rsk-card-lbl">RISK %</div>
                    <div className="rsk-card-val cf">—</div>
                    <div className="rsk-card-sub">of account</div>
                  </div>
                  <div className="rsk-card">
                    <div className="rsk-card-lbl">RISK $</div>
                    <div className="rsk-card-val cf">—</div>
                    <div className="rsk-card-sub">max loss</div>
                  </div>
                </div>
              </div>
            ) : !canTrade ? (
              <div className="rsk-notrade show">
                🚫 NO TRADE — Grade must be B or higher
                <br />
                and Breaker + Displacement must be confirmed.
              </div>
            ) : (
              <div className="rsk-body">
                <AccountInput
                  value={accountInput}
                  onChange={(raw, num) => {
                    setAccountInput(raw);
                    setAccount(num);
                  }}
                />
                <div className="rsk-main">
                  <div className="rsk-card lit">
                    <div className="rsk-card-lbl">RISK %</div>
                    <div className={`rsk-card-val ${RISK_COLOR_CLASS[grade.letter]}`}>
                      {riskPct!.toFixed(2)}%
                    </div>
                    <div className="rsk-card-sub">of account</div>
                  </div>
                  <div className="rsk-card lit">
                    <div className="rsk-card-lbl">RISK $</div>
                    <div className={`rsk-card-val ${RISK_COLOR_CLASS[grade.letter]}`}>
                      {fmtDollars(riskDollars!)}
                    </div>
                    <div className="rsk-card-sub">max loss</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="send-btn"
            disabled={koBlocked || earned === 0}
            onClick={sendToJournal}
          >
            → Log this setup as a trade in the Journal
          </button>
        </div>

        <div className="rcol">
          <div className="pnl">
            <div className="phdr red">🚫 KNOCKOUT RULES</div>
            <div className="ko-legend">
              <div className="ko-leg-row">
                <div className="ko-leg-icon">⛔</div>
                <div className="ko-leg-text">
                  <strong>Breaker Block w/ Displacement (FVG)</strong>
                  Must have valid ISPs + displacement through the breaker
                  with an aligned FVG. No trade without both.
                </div>
              </div>
              <div
                className="ko-leg-row"
                style={{
                  marginTop: 2,
                  paddingTop: 4,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div className="ko-leg-icon" style={{ color: "var(--red)" }}>
                  →
                </div>
                <div className="ko-leg-text" style={{ color: "var(--text-dim)" }}>
                  This single condition must be present regardless of overall
                  grade. Grade is overridden until confirmed.
                </div>
              </div>
            </div>
          </div>

          <div className="pnl">
            <div className="phdr">GRADE SCALE</div>
            <div className="gscale">
              <div className="gsr">
                <span className="gsl cap">A+</span>
                <div className="gsb" style={{ background: "var(--g-aplus)", width: 88 }} />
                <span className="gsp">≥90%</span>
              </div>
              <div className="gsr">
                <span className="gsl ca">A</span>
                <div className="gsb" style={{ background: "var(--g-a)", width: 78 }} />
                <span className="gsp">≥80%</span>
              </div>
              <div className="gsr">
                <span className="gsl cb">B</span>
                <div className="gsb" style={{ background: "var(--g-b)", width: 63 }} />
                <span className="gsp">≥65% ← MIN</span>
              </div>
              <div className="gsr">
                <span className="gsl cc">C</span>
                <div className="gsb" style={{ background: "var(--g-c)", width: 48 }} />
                <span className="gsp">≥50%</span>
              </div>
              <div className="gsr">
                <span className="gsl cd">D</span>
                <div className="gsb" style={{ background: "var(--g-d)", width: 33 }} />
                <span className="gsp">≥35%</span>
              </div>
              <div className="gsr">
                <span className="gsl cf">F</span>
                <div className="gsb" style={{ background: "var(--g-f)", width: 18 }} />
                <span className="gsp">&lt;35%</span>
              </div>
            </div>
          </div>

          <div className="pnl">
            <div className="phdr gold">⚠ RULES</div>
            <ul className="rul">
              <li className="warn">Lose 1 trade — done for the day</li>
              <li>Walk away after 1 win</li>
              <li>Trading 9:30–11:15 AM (close system after)</li>
              <li className="warn">No Impulse Trades — all criteria must be present</li>
              <li className="warn">No trades on CPI, FOMC, NFP or day before</li>
              <li className="caut">Caution after 200pt+ expansion in session</li>
            </ul>
          </div>

          <div className="pnl">
            <div className="phdr">🫁 BREATHING PROTOCOL</div>
            <div className="brbox">
              <div className="brsub">
                Use before trading, during uncertain setups, or after a loss
                to reset.
              </div>
              <div className="brsteps">
                <div className="brst">
                  <div className="brlbl">Inhale</div>
                  <div className="brbar" style={{ background: "var(--accent)", width: 38 }} />
                  <div className="brdur">4 sec</div>
                </div>
                <div className="brst">
                  <div className="brlbl">Hold</div>
                  <div className="brbar" style={{ background: "var(--yellow)", width: 38 }} />
                  <div className="brdur">4 sec</div>
                </div>
                <div className="brst">
                  <div className="brlbl">Exhale</div>
                  <div className="brbar" style={{ background: "var(--orange)", width: 38 }} />
                  <div className="brdur">4 sec</div>
                </div>
                <div className="brst">
                  <div className="brlbl">Hold</div>
                  <div className="brbar" style={{ background: "var(--yellow)", width: 38 }} />
                  <div className="brdur">4 sec</div>
                </div>
              </div>
              <div className="brn">Repeat 2–4 min · Calm under uncertainty</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  const id = useId();
  return (
    <>
      <input
        type="checkbox"
        className="cbi"
        id={id}
        checked={checked}
        onChange={onChange}
      />
      <label className="cbv" htmlFor={id} />
    </>
  );
}

function Criterion({
  label,
  note,
  example,
  weightClass,
  weightLabel,
  checkedVal,
  onToggle,
}: {
  label: string;
  note: string;
  example: string;
  weightClass: string;
  weightLabel: string;
  checkedVal: boolean;
  onToggle: () => void;
}) {
  return (
    <tr className={`cr${checkedVal ? " chk" : ""}`}>
      <td className="crn">{label}</td>
      <td className="crc">
        <Checkbox checked={checkedVal} onChange={onToggle} />
      </td>
      <td>
        <div className="crnt">{note}</div>
        <div className="crex">{example}</div>
      </td>
      <td className={`crw ${weightClass}`}>{weightLabel}</td>
    </tr>
  );
}

function AccountInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (raw: string, num: number) => void;
}) {
  return (
    <div className="rsk-acct">
      <div className="rsk-acct-lbl">ACCOUNT $</div>
      <input
        className="rsk-acct-inp"
        type="text"
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          const num = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
          onChange(raw, num);
        }}
      />
    </div>
  );
}
