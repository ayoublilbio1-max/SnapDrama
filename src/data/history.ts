import type { Series } from "./types";

/**
 * Continue watching — series the user started, newest first.
 * Filled by the player (next steps, saved in expo-sqlite). Empty until then → the row shows "No series yet".
 */
export function useContinueWatching(): Series[] {
  return EMPTY;
}

const EMPTY: Series[] = [];
