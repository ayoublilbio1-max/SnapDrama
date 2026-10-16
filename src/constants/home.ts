import { seriesByGroup, seriesByTag } from "../data/catalog";
import type { Catalog, Series } from "../data/types";
import type { Key } from "../i18n/strings";

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
  title: Key;
  source: RowSource;
  style?: RowStyle;
}; // title = i18n key

export const HOME_ROWS: HomeRowDef[] = [
  { id: "continue", title: "row.continue", source: { type: "continue" } },
  {
    id: "most-trending",
    title: "row.trending",
    source: { type: "group", value: "most-trending" },
    style: "ranked",
  },
  {
    id: "limited-time-deals",
    title: "row.deals",
    source: { type: "group", value: "limited-time-deals" },
    style: "deal",
  },
  {
    id: "might-love",
    title: "row.mightLove",
    source: { type: "tag", value: "Recommended" },
  },
  { id: "hot", title: "row.hot", source: { type: "tag", value: "Hot" } },
  {
    id: "forbidden-love",
    title: "row.forbidden",
    source: { type: "tag", value: "Forbidden Love" },
  },
  {
    id: "revenge",
    title: "row.revenge",
    source: { type: "tag", value: "Revenge" },
  },
  {
    id: "billionaire",
    title: "row.billionaire",
    source: { type: "tag", value: "Billionaire" },
  },
];

/** Hero carousel: these series first (in this order), then the rest of most-trending by trendingRank. */
export const HERO_FIRST = [
  "sold-to-the-mafia-queen",
  "plaything-of-the-mafia-king",
  "mrs-ceo-strictly-unprofessional",
];
export const HERO_COUNT = 10;

export function heroSeries(trending: Series[]): Series[] {
  const first = HERO_FIRST.map((id) =>
    trending.find((s) => s.id === id),
  ).filter((s): s is Series => !!s);
  const rest = trending.filter((s) => !HERO_FIRST.includes(s.id));
  return [...first, ...rest].slice(0, HERO_COUNT);
}

/** Filter chips under the header. "popular" = Home itself; the others open their own page. */
export const FILTERS = [
  { id: "popular", label: "filter.popular" },
  { id: "rankings", label: "filter.rankings" },
  { id: "new", label: "filter.new" },
  { id: "hot", label: "filter.hot" },
  { id: "categories", label: "filter.categories" },
  { id: "anime", label: "filter.anime" },
] as const satisfies readonly { id: string; label: Key }[];
export type FilterId = (typeof FILTERS)[number]["id"];

/** Categories page. Each one lists the series that have this tag in catalog.json (name shown with t.tag()). */
export const CATEGORIES = [
  "Romance",
  "Billionaire",
  "Revenge",
  "Forbidden Love",
  "CEO",
  "Mafia",
  "Secret Identity",
  "Enemies to Lovers",
  "Bodyguard",
  "Age Gap",
  "High School",
  "Thriller",
  "Fake Marriage",
  "LGBTQ+",
  "Werewolf",
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
