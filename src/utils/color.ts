/**
 * '#09011c' + 0.5 → '#09011c80'.
 * Use this in gradients instead of 'transparent': on Android 'transparent' = transparent BLACK,
 * so a fade to it passes through grey and shows a dark band / hard edge.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${full}${a}`;
}
