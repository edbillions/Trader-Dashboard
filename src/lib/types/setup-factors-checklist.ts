export interface SetupFactorsChecklist {
  killzoneConfirmed: boolean;
  biasConfirmed: boolean;
  dolIdentified: boolean;
  dolTarget: string | null;
  liquiditySweepConfirmed: boolean;
  liquiditySwept: string[];
  htfDeliveryConfirmed: boolean;
  htfFvgLevels: string[];
  premiumDiscountConfirmed: boolean;
  breakerBlockConfirmed: boolean;
  notAt2RConfirmed: boolean;
  macroWindowConfirmed: boolean;
  unicornIndicatorAlerted: boolean;
}

export function emptySetupFactorsChecklist(): SetupFactorsChecklist {
  return {
    killzoneConfirmed: false,
    biasConfirmed: false,
    dolIdentified: false,
    dolTarget: null,
    liquiditySweepConfirmed: false,
    liquiditySwept: [],
    htfDeliveryConfirmed: false,
    htfFvgLevels: [],
    premiumDiscountConfirmed: false,
    breakerBlockConfirmed: false,
    notAt2RConfirmed: false,
    macroWindowConfirmed: false,
    unicornIndicatorAlerted: false,
  };
}

export function parseSetupFactorsChecklist(raw: string | null): SetupFactorsChecklist {
  if (!raw) return emptySetupFactorsChecklist();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptySetupFactorsChecklist(), ...parsed };
  } catch {
    return emptySetupFactorsChecklist();
  }
}
