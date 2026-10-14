import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { ScreenHeader } from "../components/ScreenHeader";
import { SeriesGrid } from "../components/SeriesGrid";
import { HOME_ROWS, seriesForFilter, seriesForSource } from "../constants/home";
import { seriesByTag, useCatalog } from "../data/catalog";
import { useContinueWatching } from "../data/history";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";

/**
 * One page for every list of series:
 *   kind=row      value=<HOME_ROWS id>    (See all)
 *   kind=filter   value=new|hot|anime|popular
 *   kind=category value=<tag>             (from the Categories page)
 */
export default function BrowseScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { kind, value, title } = useLocalSearchParams<{
    kind: string;
    value: string;
    title?: string;
  }>();
  const { catalog } = useCatalog();
  const continueList = useContinueWatching();

  const items = useMemo(() => {
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

  const open = useCallback(
    (s: Series) =>
      router.push({ pathname: "/series/[id]", params: { id: s.id } }),
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={title ?? value} />
      <SeriesGrid items={items} onOpen={open} />
    </View>
  );
}
