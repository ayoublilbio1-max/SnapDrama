import type { VideoSource } from "../data/types";

/**
 * Brief §8.4 — which link to play (one place for the whole app):
 * - normal: Bunny HLS (hlsUrl)
 * - Bunny gives an error, or is not ready after BUNNY_TIMEOUT_MS (e.g. account unpaid / down) → R2 MP4, same second
 * - after one Bunny failure, use R2 directly for R2_ONLY_MS, then try Bunny again
 * - no hlsUrl → R2 · no mp4Url → Bunny only
 */
export const BUNNY_TIMEOUT_MS = 6000;
const R2_ONLY_MS = 10 * 60 * 1000;

let bunnyFailedAt = 0;

export type SourceChoice = { kind: "bunny" | "r2"; uri: string };

export function getEpisodeSource(
  v: VideoSource,
  forceR2 = false,
): SourceChoice | null {
  const bunnyBlocked = Date.now() - bunnyFailedAt < R2_ONLY_MS;
  if (v.hlsUrl && !forceR2 && !(bunnyBlocked && v.mp4Url))
    return { kind: "bunny", uri: v.hlsUrl };
  if (v.mp4Url) return { kind: "r2", uri: v.mp4Url };
  if (v.hlsUrl) return { kind: "bunny", uri: v.hlsUrl };
  return null;
}

export function markBunnyFailed(why: string) {
  bunnyFailedAt = Date.now();
  if (__DEV__)
    console.log(
      `[video] bunny marked failed (${why}) → R2 for the next 10 min`,
    );
}

export function hasVideo(v: VideoSource | undefined) {
  return !!v && !!(v.hlsUrl || v.mp4Url);
}

/** 83 → "1:23" */
export function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
