export const FOLDER_COLORS = {
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
  slate: "bg-slate-400",
} as const;

export type FolderColorKey = keyof typeof FOLDER_COLORS;

export function folderColorClass(color: string | null): string {
  if (color && color in FOLDER_COLORS) {
    return FOLDER_COLORS[color as FolderColorKey];
  }
  return "bg-border";
}
