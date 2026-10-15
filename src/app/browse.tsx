import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchField, matchesQuery } from "../components/SearchField";
import { SeriesGrid } from "../components/SeriesGrid";
import {
  FILTERS,
  HOME_ROWS,
  seriesForFilter,
  seriesForSource,
} from "../constants/home";
import { seriesByTag, useCatalog } from "../data/catalog";
import { useContinueWatching } from "../data/history";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { canNavigate } from "../utils/navLock";

/**
 * One page for every list of series:
 *   kind=row      value=<HOME_ROWS id>    (See all)
 *   kind=filter   value=new|hot|anime|popular
 *   kind=category value=<tag>             (from the Categories page)
 * The search bar searches ONLY the series of this page.
 */
export default function BrowseScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { kind, value } = useLocalSearchParams<{
    kind: string;
    value: string;
  }>();
  const t = useT();
  const { catalog } = useCatalog();
  const continueList = useContinueWatching();
  const [q, setQ] = useState("");

  const all = useMemo(() => {
    let list: Series[] = [];
    if (kind === "row") {
      const def = HOME_ROWS.find((r) => r.id === value);
      list = def ? seriesForSource(catalog, def.source, continueList) : [];
    } else if (kind === "filter") {
      list = seriesForFilter(catalog, value ?? "");
    } else if (kind === "category") {
      list = seriesByTag(catalog, value ?? "");
    }
    if (__DEV__)
      console.log(`[browse] ${kind}=${value} → ${list.length} series`);
    return list;
  }, [catalog, kind, value, continueList]);

  const query = q.trim();
  const items = useMemo(
    () => (query ? all.filter((s) => matchesQuery(s, query)) : all),
    [all, query],
  );

  const open = useCallback(
    (s: Series) => {
      if (!canNavigate(`series ${s.id}`)) return;
      if (__DEV__ && query)
        console.log(`[browse] "${query}" in ${value} → open ${s.id}`);
      router.push({ pathname: "/series/[id]", params: { id: s.id } });
    },
    [router, query, value],
  );

  // page title in the app language (changes with Settings › Language)
  const row =
    kind === "row" ? HOME_ROWS.find((r) => r.id === value) : undefined;
  const filter =
    kind === "filter" ? FILTERS.find((f) => f.id === value) : undefined;
  const pageName = row
    ? t(row.title)
    : filter
      ? t(filter.label)
      : t.tag(value ?? "");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={pageName} />
      {all.length > 0 && (
        <SearchField
          value={q}
          onChange={setQ}
          placeholder={t("search.inPage", { page: pageName })}
          style={{ marginHorizontal: 16, marginBottom: 14 }}
        />
      )}
      <SeriesGrid
        items={items}
        onOpen={open}
        emptyText={query ? t("search.none", { q: query }) : undefined}
      />
    </View>
  );
}
