import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchField, matchesQuery } from "../components/SearchField";
import { SeriesGrid } from "../components/SeriesGrid";
import { getTrending, useCatalog } from "../data/catalog";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";

/** Search all series by title or tag. Empty search → trending series. */
export default function SearchScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { catalog } = useCatalog();
  const [q, setQ] = useState("");
  const query = q.trim();

  const items = useMemo(
    () =>
      query
        ? catalog.series.filter((s) => matchesQuery(s, query))
        : getTrending(catalog),
    [catalog, query],
  );

  const open = useCallback(
    (s: Series) => {
      if (__DEV__) console.log(`[search] "${query}" → open ${s.id}`);
      router.push({ pathname: "/series/[id]", params: { id: s.id } });
    },
    [router, query],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        right={
          <SearchField
            value={q}
            onChange={setQ}
            autoFocus
            style={{ flex: 1 }}
          />
        }
      />
      <SeriesGrid
        items={items}
        onOpen={open}
        emptyText={`No series for "${query}"`}
        header={
          <AppText weight="bold" size={16} style={styles.heading}>
            {query
              ? `${items.length} result${items.length === 1 ? "" : "s"}`
              : "Popular now"}
          </AppText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { marginBottom: 12 },
});
