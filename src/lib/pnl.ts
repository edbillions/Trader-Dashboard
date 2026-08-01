export type Direction = "long" | "short";

export function formatDateWithWeekday(d: Date): string {
  const iso = d.toISOString().slice(0, 10);
  // Reparse as local midnight (same trick used elsewhere in this app,
  // e.g. requiredStartDate in actions/reviews.ts) so weekday/month/day
  // are read off the stored calendar date, not shifted by the server's
  // local timezone converting the UTC-midnight Date first.
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface InstrumentTick {
  tickValue: number;
  tickSize: number;
}

export interface TradeCalcInput {
  direction: Direction;
  entryPrice: number;
  exitPrice: number | null | undefined;
  positionSize: number;
  commission: number | null | undefined;
  stopLossPlanned: number | null | undefined;
  entryTime: Date | string;
  exitTime: Date | string | null | undefined;
  instrument: InstrumentTick | null | undefined;
}

export interface TradeCalcResult {
  grossPnl: number | null;
  netPnl: number | null;
  rMultiple: number | null;
  durationMinutes: number | null;
}

function priceDeltaToDollars(
  delta: number,
  positionSize: number,
  instrument: InstrumentTick,
) {
  const ticks = delta / instrument.tickSize;
  return ticks * instrument.tickValue * positionSize;
}

export function calculateTrade(input: TradeCalcInput): TradeCalcResult {
  const {
    direction,
    entryPrice,
    exitPrice,
    positionSize,
    commission,
    stopLossPlanned,
    entryTime,
    exitTime,
    instrument,
  } = input;

  let grossPnl: number | null = null;
  let netPnl: number | null = null;
  let rMultiple: number | null = null;
  let durationMinutes: number | null = null;

  if (
    exitPrice != null &&
    instrument &&
    Number.isFinite(entryPrice) &&
    Number.isFinite(exitPrice) &&
    positionSize > 0
  ) {
    const rawDelta =
      direction === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
    grossPnl = priceDeltaToDollars(rawDelta, positionSize, instrument);
    netPnl = grossPnl - (commission ?? 0);

    if (stopLossPlanned != null && Number.isFinite(stopLossPlanned)) {
      const riskPoints = Math.abs(entryPrice - stopLossPlanned);
      if (riskPoints > 0) {
        const riskDollars = priceDeltaToDollars(
          riskPoints,
          positionSize,
          instrument,
        );
        if (riskDollars > 0) {
          rMultiple = netPnl / riskDollars;
        }
      }
    }
  }

  if (exitTime) {
    const start = new Date(entryTime).getTime();
    const end = new Date(exitTime).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      durationMinutes = Math.round((end - start) / 60000);
    }
  }

  return { grossPnl, netPnl, rMultiple, durationMinutes };
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatR(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}R`;
}
