import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterChips } from "../../components/FilterChips";
import { HeroCarousel } from "../../components/HeroCarousel";
import { HomeHeader } from "../../components/HomeHeader";
import { HomeRow } from "../../components/HomeRow";
import { HomeSkeleton } from "../../components/Skeleton";
import {
  FILTERS,
  HERO_COUNT,
  HOME_ROWS,
  seriesForSource,
  type FilterId,
  type HomeRowDef,
} from "../../constants/home";
import { TAB_BAR_SPACE } from "../../constants/layout";
import { getTrending, useCatalog } from "../../data/catalog";
import { useContinueWatching } from "../../data/history";
import type { Series } from "../../data/types";
import { useTheme } from "../../hooks/useTheme";

export default function HomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { catalog, status, source } = useCatalog();
  const continueList = useContinueWatching();

  const hero = useMemo(
    () => getTrending(catalog).slice(0, HERO_COUNT),
    [catalog],
  );
  const rows = useMemo(
    () =>
      HOME_ROWS.map((def) => ({
        def,
        items: seriesForSource(catalog, def.source, continueList),
      })),
    [catalog, continueList],
  );

  useEffect(() => {
    if (!__DEV__ || status !== "ready") return;
    const filled = rows
      .filter((r) => r.items.length)
      .map((r) => `${r.def.id} ${r.items.length}`);
    const empty = rows.filter((r) => !r.items.length).map((r) => r.def.id);
    console.log(
      `[home] catalog v${catalog.version} (${source}) — hero ${hero.length} · ${filled.join(", ")}`,
    );
    console.log(`[home] empty rows: ${empty.join(", ") || "none"}`);
  }, [rows, hero.length, catalog.version, source, status]);

  // Stable callbacks → memoized rows/cards don't re-render on every Home render
  const openSeries = useCallback(
    (s: Series) => {
      if (__DEV__) console.log(`[home] open series ${s.id}`);
      router.push({ pathname: "/series/[id]", params: { id: s.id } });
    },
    [router],
  );

  const seeAll = useCallback(
    (def: HomeRowDef) => {
      if (__DEV__) console.log(`[home] see all ${def.id}`);
      router.push({
        pathname: "/browse",
        params: { kind: "row", value: def.id, title: def.title },
      });
    },
    [router],
  );

  const onFilter = useCallback(
    (id: FilterId) => {
      if (__DEV__) console.log(`[home] filter ${id}`);
      if (id === "popular") return; // Popular = this page
      if (id === "categories") {
        router.push("/categories");
        return;
      }
      const label = FILTERS.find((f) => f.id === id)?.label ?? id;
      router.push({
        pathname: "/browse",
        params: { kind: "filter", value: id, title: label },
      });
    },
    [router],
  );

  const openVip = useCallback(() => router.push("/vip"), [router]);
  const openSearch = useCallback(() => router.push("/search"), [router]);

  if (status === "loading") return <HomeSkeleton />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: TAB_BAR_SPACE + insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader onVip={openVip} onSearch={openSearch} />
      <FilterChips onPress={onFilter} />
      <HeroCarousel items={hero} onOpen={openSeries} />
      {rows.map(({ def, items }) => (
        <HomeRow
          key={def.id}
          def={def}
          items={items}
          onOpenSeries={openSeries}
          onSeeAll={seeAll}
        />
      ))}
    </ScrollView>
  );
}
