import Storage from "expo-sqlite/kv-store";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CATALOG_URL } from "../constants/app";
import type { T } from "../i18n";
import type { Catalog, Series } from "./types";

/**
 * Catalog loading (brief §8, DECIDED: both):
 * 1. Start with the newest copy we have: saved on the phone (kv-store) or shipped in the app.
 * 2. In the background, download catalog.json from R2. If its version is higher → save it + update.
 * 3. R2 down / offline → nothing changes for the user.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SHIPPED: Catalog = require("../../assets/data/catalog.json");
const STORAGE_KEY = "catalog.json";
const R2_TIMEOUT_MS = 8000;

type Source = "shipped" | "saved" | "r2";
type CatalogState = {
  catalog: Catalog;
  status: "loading" | "ready";
  source: Source;
};

const CatalogContext = createContext<CatalogState>({
  catalog: SHIPPED,
  status: "loading",
  source: "shipped",
});

function isValidCatalog(c: unknown): c is Catalog {
  const x = c as Catalog;
  return !!x && typeof x.version === "number" && Array.isArray(x.series);
}

async function fetchFromR2(): Promise<Catalog | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), R2_TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(`${CATALOG_URL}?t=${Date.now()}`, {
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: unknown = await res.json();
    if (!isValidCatalog(json)) throw new Error("invalid file");
    if (__DEV__)
      console.log(
        `[catalog] r2 v${json.version} downloaded in ${Date.now() - t0}ms`,
      );
    return json;
  } catch (e) {
    if (__DEV__) console.log(`[catalog] r2 failed (${String(e)})`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>({
    catalog: SHIPPED,
    status: "loading",
    source: "shipped",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      const t0 = Date.now();
      let current: Catalog = SHIPPED;
      let source: Source = "shipped";
      try {
        const raw = await Storage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: unknown = JSON.parse(raw);
          if (isValidCatalog(saved) && saved.version > current.version) {
            current = saved;
            source = "saved";
          }
        }
      } catch (e) {
        if (__DEV__) console.log("[catalog] saved copy unreadable", String(e));
      }
      if (!alive) return;
      setState({ catalog: current, status: "ready", source });
      if (__DEV__)
        console.log(
          `[catalog] ready v${current.version} from ${source} in ${Date.now() - t0}ms — ${current.series.length} series`,
        );

      const fresh = await fetchFromR2();
      if (!alive) return;
      if (!fresh) {
        if (__DEV__) console.log(`[catalog] keep v${current.version}`);
        return;
      }
      if (fresh.version > current.version) {
        await Storage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(
          () => {},
        );
        setState({ catalog: fresh, status: "ready", source: "r2" });
        if (__DEV__)
          console.log(
            `[catalog] updated v${current.version} → v${fresh.version} (saved)`,
          );
      } else if (__DEV__) {
        console.log(
          `[catalog] r2 v${fresh.version} is not newer — keep v${current.version}`,
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}

export function useSeries(id: string | undefined) {
  const { catalog } = useCatalog();
  return useMemo(() => catalog.series.find((s) => s.id === id), [catalog, id]);
}

// ─── helpers (no number is hard-coded in screens) ───

export function isEpisodeFree(series: Series, n: number) {
  return n <= series.freeEpisodes;
}

export function getTrending(catalog: Catalog) {
  return catalog.series
    .filter((s) => s.trending)
    .sort((a, b) => (a.trendingRank ?? 999) - (b.trendingRank ?? 999));
}

export function seriesByGroup(catalog: Catalog, group: string) {
  const list = catalog.series.filter((s) => s.group === group);
  return group === "most-trending"
    ? list.sort((a, b) => (a.trendingRank ?? 999) - (b.trendingRank ?? 999))
    : list;
}

export function seriesByTag(catalog: Catalog, tag: string) {
  const t = tag.toLowerCase();
  return catalog.series.filter((s) =>
    s.tags.some((x) => x.toLowerCase() === t),
  );
}

/** "EP 1–5 free" badge, in the app language (pass the `t` from useT()). */
export function freeLabel(series: Series, t: T) {
  if (series.freeEpisodes <= 0) return t("free.trailer");
  return series.freeEpisodes === 1
    ? t("free.one")
    : t("free.many", { n: series.freeEpisodes });
}
