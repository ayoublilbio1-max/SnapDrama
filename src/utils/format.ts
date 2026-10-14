/** 125000 → "125K", 1250000 → "1.2M" */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (n >= 1_000) return `${trim(n / 1_000)}K`;
  return String(n);
}

function trim(x: number) {
  return x >= 100 ? String(Math.round(x)) : String(Math.round(x * 10) / 10);
}
