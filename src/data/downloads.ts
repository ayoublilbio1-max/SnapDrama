import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import type { Episode, Series } from "./types";

/**
 * Downloads (like ShortMax / NetShort): an episode's MP4 (R2 link) is saved in the app's own folder,
 * then the player uses the local file first → it plays without internet.
 * List saved in expo-sqlite kv-store; files in <documents>/downloads/.
 */
export type DownloadItem = {
  seriesId: string;
  n: number;
  title: string;
  cover: string;
  uri: string;
  size: number;
  at: number;
};
type State = {
  items: Record<string, DownloadItem>;
  busy: Record<string, true>;
};

const KEY = "downloads.v1";

// expo-file-system loaded safely: if a build ever misses it, only downloads are off (the app still starts)
type FS = typeof import("expo-file-system");
let fsModule: FS | null | undefined;
function getFS(): FS | null {
  if (fsModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      fsModule = require("expo-file-system") as FS;
    } catch (e) {
      fsModule = null;
      if (__DEV__)
        console.log(
          "[downloads] expo-file-system not available in this build",
          String(e),
        );
    }
  }
  return fsModule;
}
let state: State = { items: {}, busy: {} };
let loaded = false;
const listeners = new Set<() => void>();

export const downloadKey = (seriesId: string, n: number) => `${seriesId}:${n}`;

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}
function persist() {
  Storage.setItem(KEY, JSON.stringify(state.items)).catch(() => {});
}

function folder(fs: FS) {
  const dir = new fs.Directory(fs.Paths.document, "downloads");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Delete account: every downloaded file goes. */
export function deleteAllDownloadFiles() {
  const fs = getFS();
  if (!fs) return;
  const dir = new fs.Directory(fs.Paths.document, "downloads");
  if (dir.exists) dir.delete();
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await Storage.getItem(KEY);
    const items: Record<string, DownloadItem> = raw ? JSON.parse(raw) : {};
    // a file removed by the phone (storage cleaner) → forget it
    const fs = getFS();
    for (const k of Object.keys(items)) {
      if (!fs || !new fs.File(items[k].uri).exists) delete items[k];
    }
    emit({ ...state, items });
    if (__DEV__)
      console.log(
        `[downloads] loaded — ${Object.keys(items).length} episodes, ${formatSize(totalSize(items))}`,
      );
  } catch (e) {
    if (__DEV__) console.log("[downloads] load failed", String(e));
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  load();
  return () => {
    listeners.delete(l);
  };
}

export function preloadDownloads() {
  load();
}

export function useDownloads(): State {
  return useSyncExternalStore(subscribe, () => state);
}

/** Local file of this episode if downloaded (the player plays it first). */
export function useDownloadUri(seriesId: string, n: number): string | null {
  return useSyncExternalStore(
    subscribe,
    () => state.items[downloadKey(seriesId, n)]?.uri ?? null,
  );
}

export function totalSize(items: Record<string, DownloadItem>) {
  return Object.values(items).reduce((sum, d) => sum + (d.size || 0), 0);
}

export function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  return `${Math.max(0, Math.round(bytes / 1024 / 1024))} MB`;
}

export const downloadActions = {
  /** Saves the episode MP4. Returns false when it has no MP4 link or the download failed. */
  async download(series: Series, ep: Episode): Promise<boolean> {
    const k = downloadKey(series.id, ep.n);
    if (state.items[k] || state.busy[k]) return true;
    const fs = getFS();
    if (!ep.mp4Url || !fs) {
      if (__DEV__)
        console.log(
          `[downloads] ${k} can't download (${!fs ? "no file system" : "no MP4 link"})`,
        );
      return false;
    }
    emit({ ...state, busy: { ...state.busy, [k]: true } });
    const t0 = Date.now();
    try {
      const dest = new fs.File(folder(fs), `${series.id}_${ep.n}.mp4`);
      if (dest.exists) dest.delete();
      const file = await fs.File.downloadFileAsync(ep.mp4Url, dest);
      const item: DownloadItem = {
        seriesId: series.id,
        n: ep.n,
        title: series.title,
        cover: series.cover,
        uri: file.uri,
        size: file.size,
        at: Date.now(),
      };
      const busy = { ...state.busy };
      delete busy[k];
      emit({ items: { ...state.items, [k]: item }, busy });
      persist();
      if (__DEV__)
        console.log(
          `[downloads] ${k} done in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${formatSize(item.size)}`,
        );
      return true;
    } catch (e) {
      const busy = { ...state.busy };
      delete busy[k];
      emit({ ...state, busy });
      if (__DEV__) console.log(`[downloads] ${k} failed`, String(e));
      return false;
    }
  },
  remove(keys: string[]) {
    const fs = getFS();
    const items = { ...state.items };
    for (const k of keys) {
      const d = items[k];
      if (!d) continue;
      try {
        const f = fs ? new fs.File(d.uri) : null;
        if (f?.exists) f.delete();
      } catch (e) {
        if (__DEV__) console.log(`[downloads] delete ${k} failed`, String(e));
      }
      delete items[k];
    }
    emit({ ...state, items });
    persist();
    if (__DEV__)
      console.log(`[downloads] removed ${keys.length}: ${keys.join(", ")}`);
  },
};
