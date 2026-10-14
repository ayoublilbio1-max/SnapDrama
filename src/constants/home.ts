import { seriesByGroup, seriesByTag } from "../data/catalog";
import type { Catalog, Series } from "../data/types";

/**
 * Home rows, in order. To add a row later: add one line here (JS only).
 * - group rows read `group` in catalog.json
 * - tag rows read `tags` in catalog.json (e.g. "tags": ["Revenge", "Hot"])
 * A row with no series shows "No series yet".
 */
export type RowSource =
  | { type: "continue" }
  | { type: "group"; value: string }
  | { type: "tag"; value: string };
export type RowStyle = "default" | "ranked" | "deal";
export type HomeRowDef = {
  id: string;
  title: string;
  source: RowSource;
  style?: RowStyle;
};

export const HOME_ROWS: HomeRowDef[] = [
  { id: "continue", title: "Continue watching", source: { type: "continue" } },
  {
    id: "most-trending",
    title: "Most trending",
    source: { type: "group", value: "most-trending" },
    style: "ranked",
  },
  {
    id: "limited-time-deals",
    title: "Limited-time deals",
    source: { type: "group", value: "limited-time-deals" },
    style: "deal",
  },
  {
    id: "might-love",
    title: "We think you might love",
    source: { type: "tag", value: "Recommended" },
  },
  { id: "hot", title: "Hot", source: { type: "tag", value: "Hot" } },
  {
    id: "forbidden-love",
    title: "Forbidden Love",
    source: { type: "tag", value: "Forbidden Love" },
  },
  {
    id: "revenge",
    title: "Revenge",
    source: { type: "tag", value: "Revenge" },
  },
  {
    id: "billionaire",
    title: "Billionaire",
    source: { type: "tag", value: "Billionaire" },
  },
];

/** Hero carousel: the first N series of most-trending (by trendingRank). */
export const HERO_COUNT = 10;

/** Filter chips under the header. "popular" = Home itself; the others open their own page. */
export const FILTERS = [
  { id: "popular", label: "Popular" },
  { id: "new", label: "New" },
  { id: "hot", label: "Hot" },
  { id: "categories", label: "Categories" },
  { id: "anime", label: "Anime" },
] as const;
export type FilterId = (typeof FILTERS)[number]["id"];

/** Categories page. Each one lists the series that have this tag in catalog.json. */
export const CATEGORIES = [
  "Romance",
  "Revenge",
  "Billionaire",
  "Forbidden Love",
  "Mafia",
  "CEO",
  "Werewolf",
  "Secret Identity",
  "Enemies to Lovers",
  "Anime",
];

export function seriesForSource(
  catalog: Catalog,
  source: RowSource,
  continueList: Series[],
): Series[] {
  if (source.type === "continue") return continueList;
  if (source.type === "group") return seriesByGroup(catalog, source.value);
  return seriesByTag(catalog, source.value);
}

/** Series for a filter page (New / Hot / Anime / Popular). */
export function seriesForFilter(catalog: Catalog, id: string): Series[] {
  if (id === "popular")
    return [...catalog.series].sort((a, b) => b.saveCount - a.saveCount);
  if (id === "new") return seriesByTag(catalog, "New");
  if (id === "hot") return seriesByTag(catalog, "Hot");
  if (id === "anime") return seriesByTag(catalog, "Anime");
  return [];
}
