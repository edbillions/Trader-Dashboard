import type { Instrument } from "@/lib/ai/premarket-analysis";

// ES support stays in the codebase (Instrument type, schema, Settings chart
// layouts) so it can be turned back on later just by adding it back here —
// for now the user only wants NQ analyzed and shown.
export const ACTIVE_INSTRUMENTS: Instrument[] = ["NQ"];
