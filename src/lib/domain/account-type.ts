export const ACCOUNT_TYPES = ["eval", "funded", "live"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  eval: "Evaluation",
  funded: "Funded",
  live: "Live",
};
