/** Caps so translations fit existing UI. Numbers are the smallest that still pass en and zh-Hans. */
export const LENGTH_RULES = {
  tabMax: 12,
  actionMax: 40,
  restMultiplier: 2.2,
  restExtra: 14,
} as const;

const ACTION_MARKERS = ["submit", "retry", "cancel", "confirm", "save", "sync", "connect"];

export function maxLengthFor(key: string, english: string): number {
  if (key.startsWith("tab.")) return LENGTH_RULES.tabMax;
  const lower = key.toLowerCase();
  if (ACTION_MARKERS.some((marker) => lower.includes(marker))) return LENGTH_RULES.actionMax;
  return Math.max(english.length * LENGTH_RULES.restMultiplier, english.length + LENGTH_RULES.restExtra);
}
