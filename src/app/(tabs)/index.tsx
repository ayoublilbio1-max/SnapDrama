import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FilterChips } from "../../components/FilterChips";
import { HeroCarousel } from "../../components/HeroCarousel";
import { HomeHeader } from "../../components/HomeHeader";
import { HomeRow } from "../../components/HomeRow";
import { HomeSkeleton } from "../../components/Skeleton";
import {
  HOME_ROWS,
  heroSeries,
  seriesForSource,
  type FilterId,
  type HomeRowDef,
} from "../../constants/home";
import { TAB_BAR_SPACE } from "../../constants/layout";
import { getTrending, useCatalog } from "../../data/catalog";
import { useContinueWatching, useHistory } from "../../data/history";
import type { Series } from "../../data/types";
import { useTheme } from "../../hooks/useTheme";
import { canNavigate } from "../../utils/navLock";

export default function HomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { catalog, status, source } = useCatalog();
  const continueList = useContinueWatching();
  const history = useHistory();
  const historyRef = useRef(history);
  historyRef.current = history;

  const hero = useMemo(() => heroSeries(getTrending(catalog)), [catalog]);
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
    console.log(`[home] hero order: ${hero.map((s) => s.id).join(", ")}`);
  }, [rows, hero, catalog.version, source, status]);

  // Stable callbacks → memoized rows/cards don't re-render on every Home render
  const openSeries = useCallback(
    (s: Series) => {
      if (!canNavigate(`series ${s.id}`)) return;
      if (__DEV__) console.log(`[home] open series ${s.id}`);
      router.push({ pathname: "/series/[id]", params: { id: s.id } });
    },
    [router],
  );

  // Continue watching → straight back into the player, at the saved episode + second
  const resumeSeries = useCallback(
    (s: Series) => {
      if (!canNavigate(`continue ${s.id}`)) return;
      const h = historyRef.current[s.id];
      if (__DEV__)
        console.log(
          `[home] continue ${s.id} ep ${h?.ep ?? 1} at ${h?.pos ?? 0}s`,
        );
      router.push({
        pathname: "/watch/[id]",
        params: { id: s.id, ep: String(h?.ep ?? 1), t: String(h?.pos ?? 0) },
      });
    },
    [router],
  );

  const seeAll = useCallback(
    (def: HomeRowDef) => {
      if (!canNavigate(`see all ${def.id}`)) return;
      if (__DEV__) console.log(`[home] see all ${def.id}`);
      router.push({
        pathname: "/browse",
        params: { kind: "row", value: def.id },
      });
    },
    [router],
  );

  const onFilter = useCallback(
    (id: FilterId) => {
      if (__DEV__) console.log(`[home] filter ${id}`);
      if (id === "popular") return; // Popular = this page
      if (!canNavigate(`filter ${id}`)) return;
      if (id === "rankings") {
        router.push("/rankings");
        return;
      }
      if (id === "categories") {
        router.push("/categories");
        return;
      }
      router.push({
        pathname: "/browse",
        params: { kind: "filter", value: id },
      });
    },
    [router],
  );

  const openVip = useCallback(
    () => canNavigate("vip") && router.push("/vip"),
    [router],
  );
  const openSearch = useCallback(
    () => canNavigate("search") && router.push("/search"),
    [router],
  );

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
          onOpenSeries={def.id === "continue" ? resumeSeries : openSeries}
          onSeeAll={seeAll}
        />
      ))}
    </ScrollView>
  );
}
