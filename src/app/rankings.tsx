import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { ScreenHeader } from "../components/ScreenHeader";
import { freeLabel, getTrending, useCatalog } from "../data/catalog";
import type { Series } from "../data/types";
import { seriesStats, useUserState } from "../data/userStore";
import { useTheme } from "../hooks/useTheme";
import { useT, type Key } from "../i18n";
import { formatCount } from "../utils/format";
import { canNavigate } from "../utils/navLock";

type Board = "trending" | "saved" | "rated";
const BOARDS: {
  id: Board;
  label: Key;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}[] = [
  { id: "trending", label: "rank.trending", icon: "flame" },
  { id: "saved", label: "rank.saved", icon: "bookmark" },
  { id: "rated", label: "rank.rated", icon: "star" },
];
const TOP = 20;
const HIDDEN_TAGS = new Set(["Recommended", "New", "Hot"]);

/** Top charts (like ReelShort / DramaBox rankings): Trending · Most saved · Top rated. Your saves and stars count too. */
export default function RankingsScreen() {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { catalog } = useCatalog();
  const user = useUserState();
  const [board, setBoard] = useState<Board>("trending");

  const list = useMemo(() => {
    const withStats = catalog.series.map((s) => ({
      s,
      st: seriesStats(s, user),
    }));
    let sorted: typeof withStats;
    if (board === "trending") {
      const trending = getTrending(catalog);
      const rest = catalog.series
        .filter((s) => !s.trending)
        .sort((a, b) => b.saveCount - a.saveCount);
      sorted = [...trending, ...rest].map((s) => ({
        s,
        st: seriesStats(s, user),
      }));
    } else if (board === "saved") {
      sorted = withStats.sort((a, b) => b.st.saveCount - a.st.saveCount);
    } else {
      sorted = withStats.sort(
        (a, b) =>
          b.st.rating - a.st.rating || b.st.ratingCount - a.st.ratingCount,
      );
    }
    if (__DEV__)
      console.log(`[rankings] ${board} → #1 ${sorted[0]?.s.id ?? "-"}`);
    return sorted.slice(0, TOP);
  }, [catalog, user, board]);

  const open = useCallback(
    (s: Series) => {
      if (!canNavigate(`series ${s.id}`)) return;
      router.push({ pathname: "/series/[id]", params: { id: s.id } });
    },
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("filter.rankings")} />
      <View
        style={[
          styles.tabs,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {BOARDS.map((b) => {
          const on = b.id === board;
          return (
            <Pressable
              key={b.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setBoard(b.id);
              }}
              style={[styles.tab, on && { backgroundColor: colors.primary }]}
            >
              <Ionicons
                name={b.icon}
                size={14}
                color={on ? colors.onPrimary : colors.textMuted}
              />
              <AppText
                weight="semibold"
                size={13}
                color={on ? "onPrimary" : "textMuted"}
                numberOfLines={1}
              >
                {t(b.label)}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={list}
        keyExtractor={(x) => x.s.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: { s, st }, index }) => {
          const rank = index + 1;
          const medal = rank <= 3;
          const genres = s.tags
            .filter((tag) => !HIDDEN_TAGS.has(tag))
            .slice(0, 2);
          return (
            <Pressable
              onPress={() => open(s)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <AppText
                weight="bold"
                size={medal ? 26 : 20}
                style={[
                  styles.rank,
                  { color: medal ? colors.gold : colors.textMuted },
                ]}
              >
                {rank}
              </AppText>
              <View
                style={[styles.cover, { backgroundColor: colors.skeleton }]}
              >
                <Image
                  source={{ uri: s.cover }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={s.id}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText weight="semibold" size={15} numberOfLines={2}>
                  {s.title}
                </AppText>
                <AppText size={12} color="textMuted" numberOfLines={1}>
                  {genres.map((g) => t.tag(g)).join(" · ")}
                  {genres.length ? " · " : ""}
                  {freeLabel(s, t)}
                </AppText>
                <View style={styles.stat}>
                  {board === "rated" ? (
                    <>
                      <Ionicons name="star" size={13} color={colors.gold} />
                      <AppText weight="semibold" size={13}>
                        {st.rating.toFixed(1)}
                      </AppText>
                      <AppText size={12} color="textMuted">
                        ({formatCount(st.ratingCount)})
                      </AppText>
                    </>
                  ) : board === "saved" ? (
                    <>
                      <Ionicons
                        name="bookmark"
                        size={13}
                        color={colors.primary}
                      />
                      <AppText weight="semibold" size={13}>
                        {formatCount(st.saveCount)}
                      </AppText>
                    </>
                  ) : (
                    <>
                      <Ionicons name="flame" size={13} color={colors.gold} />
                      <AppText weight="semibold" size={13}>
                        {formatCount(st.saveCount + st.shareCount)}
                      </AppText>
                      <AppText size={12} color="textMuted">
                        {t("rank.hot")}
                      </AppText>
                    </>
                  )}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
  },
  rank: { width: 30, textAlign: "center" },
  cover: { width: 60, height: 80, borderRadius: 10, overflow: "hidden" },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
});
