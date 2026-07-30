export interface ManagementTradeInput {
  id: string;
  entryTime: Date;
  direction: string;
  entryPrice: number;
  stopLossPlanned: number | null;
  targetPlanned: number | null;
  stopLossActual: number | null;
  targetActual: number | null;
  exitPrice: number | null;
  mfeR: number | null;
  maeR: number | null;
  rMultiple: number | null;
}

export type ManagementClassification =
  | "hurtByManagement"
  | "improvedByManagement"
  | "asPlanned"
  | "inconclusive";

export interface ManagementTradeResult {
  id: string;
  entryTime: Date;
  actualR: number | null;
  potentialR: number | null;
  classification: ManagementClassification;
  hitTp: boolean;
  hitSl: boolean;
  exitedBeforeTp: boolean;
}

export interface ManagementPoint {
  date: string;
  actualR: number;
  potentialR: number;
  gainedByManaging: number;
}

export interface ManagementStats {
  sampleSize: number;
  hurtByManagementCount: number;
  improvedByManagementCount: number;
  asPlannedCount: number;
  hitTpCount: number;
  hitSlCount: number;
  neitherCount: number;
  exitedBeforeTpCount: number;
  managementImpactPct: number | null;
  cumulativeSeries: ManagementPoint[];
  trades: ManagementTradeResult[];
}

const EPSILON = 0.05;
const STOP_TOLERANCE_R = 1;

function plannedRR(t: ManagementTradeInput): number | null {
  if (t.stopLossPlanned == null || t.targetPlanned == null) return null;
  const risk = Math.abs(t.entryPrice - t.stopLossPlanned);
  const reward = Math.abs(t.targetPlanned - t.entryPrice);
  return risk > 0 ? reward / risk : null;
}

// Reconstructs a hypothetical "stuck to plan" outcome from the two logged
// price extremes (MFE/MAE). This is an APPROXIMATION — MFE/MAE are scalar
// extremes, not a full intra-trade price path, so we don't know whether the
// favorable or adverse excursion happened first. Trades where neither
// threshold was clearly reached are excluded (potentialR stays null).
function hypotheticalOutcome(t: ManagementTradeInput): number | null {
  const rr = plannedRR(t);
  if (rr == null) return null;
  if (t.mfeR != null && t.mfeR >= rr) return rr;
  if (t.maeR != null && t.maeR >= STOP_TOLERANCE_R) return -1;
  return null;
}

function classify(
  actualR: number | null,
  potentialR: number | null,
): ManagementClassification {
  if (actualR == null || potentialR == null) return "inconclusive";
  const diff = actualR - potentialR;
  if (diff < -EPSILON) return "hurtByManagement";
  if (diff > EPSILON) return "improvedByManagement";
  return "asPlanned";
}

function checkExit(
  t: ManagementTradeInput,
): { hitTp: boolean; hitSl: boolean } {
  if (t.exitPrice == null) return { hitTp: false, hitSl: false };
  const targetRef = t.targetActual ?? t.targetPlanned;
  const slRef = t.stopLossActual ?? t.stopLossPlanned;
  const isLong = t.direction === "long";

  const hitTp =
    targetRef != null &&
    (isLong ? t.exitPrice >= targetRef : t.exitPrice <= targetRef);
  const hitSl =
    slRef != null && (isLong ? t.exitPrice <= slRef : t.exitPrice >= slRef);

  return { hitTp, hitSl };
}

export function computeManagementStats(
  trades: ManagementTradeInput[],
): ManagementStats {
  const chrono = [...trades].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime(),
  );

  const results: ManagementTradeResult[] = chrono.map((t) => {
    const potentialR = hypotheticalOutcome(t);
    const actualR = t.rMultiple;
    const rr = plannedRR(t);
    const { hitTp, hitSl } = checkExit(t);
    const isWinner = (t.rMultiple ?? 0) > 0;
    const exitedBeforeTp =
      isWinner && rr != null && t.mfeR != null && t.mfeR >= rr && !hitTp;

    return {
      id: t.id,
      entryTime: t.entryTime,
      actualR,
      potentialR,
      classification: classify(actualR, potentialR),
      hitTp,
      hitSl,
      exitedBeforeTp,
    };
  });

  let cumulativeActual = 0;
  let cumulativePotential = 0;
  const cumulativeSeries: ManagementPoint[] = results.map((r) => {
    const actualForSeries = r.actualR ?? 0;
    const potentialForSeries = r.potentialR ?? actualForSeries;
    cumulativeActual += actualForSeries;
    cumulativePotential += potentialForSeries;
    return {
      date: r.entryTime.toISOString().slice(0, 10),
      actualR: Math.round(cumulativeActual * 100) / 100,
      potentialR: Math.round(cumulativePotential * 100) / 100,
      gainedByManaging:
        Math.round((cumulativeActual - cumulativePotential) * 100) / 100,
    };
  });

  const withPotential = results.filter((r) => r.potentialR != null);
  const last = cumulativeSeries[cumulativeSeries.length - 1];
  const managementImpactPct =
    last && last.potentialR !== 0
      ? ((last.actualR - last.potentialR) / Math.abs(last.potentialR)) * 100
      : null;

  return {
    sampleSize: withPotential.length,
    hurtByManagementCount: results.filter(
      (r) => r.classification === "hurtByManagement",
    ).length,
    improvedByManagementCount: results.filter(
      (r) => r.classification === "improvedByManagement",
    ).length,
    asPlannedCount: results.filter((r) => r.classification === "asPlanned")
      .length,
    hitTpCount: results.filter((r) => r.hitTp).length,
    hitSlCount: results.filter((r) => r.hitSl).length,
    neitherCount: results.filter((r) => !r.hitTp && !r.hitSl).length,
    exitedBeforeTpCount: results.filter((r) => r.exitedBeforeTp).length,
    managementImpactPct,
    cumulativeSeries,
    trades: results,
  };
}
