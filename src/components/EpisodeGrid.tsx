import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { episodeView, progressKey, useProgress } from "../data/progress";
import type { Series } from "../data/types";
import { episodeState, useUnlocked, type EpisodeState } from "../data/wallet";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { AppText } from "./AppText";

const PER_RANGE = 30; // tabs: 1-30, 31-60…
const COLUMNS = 5;
const GAP = 8;

export type { EpisodeState };

/**
 * Episode numbers 1..totalEpisodes (brief §8): free ones playable, the others locked with a price,
 * unlocked ones (demo coins) with an open gold lock.
 * Watched = muted box + ✓ · started = thin progress bar at the bottom (YouTube style) · current = violet border.
 */
export const EpisodeGrid = memo(function EpisodeGrid({
  series,
  coinsPerEpisode,
  onPress,
  current = 0,
}: {
  series: Series;
  coinsPerEpisode: number;
  onPress: (n: number, state: EpisodeState) => void;
  current?: number; // episode playing now (player sheet)
}) {
  const colors = useTheme();
  const t = useT();
  const progress = useProgress();
  const unlocked = useUnlocked();
  const { width } = useWindowDimensions();
  const total = series.totalEpisodes;
  const ranges = useMemo(() => {
    const r: [number, number][] = [];
    for (let a = 1; a <= total; a += PER_RANGE)
      r.push([a, Math.min(total, a + PER_RANGE - 1)]);
    return r;
  }, [total]);
  // open on the tab that contains the current episode
  const [range, setRange] = useState(() =>
    Math.max(0, Math.floor((Math.max(1, current) - 1) / PER_RANGE)),
  );
  const [from, to] = ranges[Math.min(range, ranges.length - 1)] ?? [1, total];
  const tileW = Math.floor((width - 32 - GAP * (COLUMNS - 1)) / COLUMNS);

  const nums = [];
  for (let n = from; n <= to; n++) nums.push(n);

  return (
    <View>
      {ranges.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ranges}
        >
          {ranges.map(([a, b], i) => {
            const on = i === range;
            return (
              <Pressable key={a} onPress={() => setRange(i)} hitSlop={6}>
                <AppText
                  weight={on ? "bold" : "medium"}
                  size={14}
                  color={on ? "text" : "textMuted"}
                >
                  {a}-{b}
                </AppText>
                <View
                  style={[
                    styles.underline,
                    { backgroundColor: on ? colors.primary : "transparent" },
                  ]}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.grid}>
        {nums.map((n) => {
          const state = episodeState(series, n, unlocked);
          const free = state === "free";
          const { watched, ratio } = free
            ? episodeView(progress[progressKey(series.id, n)])
            : { watched: false, ratio: 0 };
          const isCurrent = n === current;
          return (
            <Pressable
              key={n}
              onPress={() => onPress(n, state)}
              style={({ pressed }) => [
                styles.tile,
                {
                  width: tileW,
                  backgroundColor: watched ? colors.surfaceAlt : colors.surface,
                  borderColor: isCurrent
                    ? colors.primary
                    : state === "locked"
                      ? colors.goldSoft
                      : colors.border,
                  borderWidth: isCurrent ? 1.5 : 1,
                  opacity: pressed ? 0.7 : watched && !isCurrent ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                free
                  ? `${t("ep.label", { n })}${watched ? `, ${t("ep.watched")}` : ratio > 0 ? `, ${t("ep.percent", { n: Math.round(ratio * 100) })}` : ""}`
                  : state === "unlocked"
                    ? `${t("ep.label", { n })}, ${t("ep.unlocked")}`
                    : `${t("ep.label", { n })}, ${t("ep.locked")}, ${t("coins.n", { n: coinsPerEpisode })}`
              }
            >
              {isCurrent ? (
                <Ionicons name="stats-chart" size={14} color={colors.primary} />
              ) : (
                <AppText
                  weight="semibold"
                  size={16}
                  color={watched ? "textMuted" : "text"}
                >
                  {n}
                </AppText>
              )}

              {state === "locked" ? (
                <View style={styles.lockCorner}>
                  <Ionicons name="lock-closed" size={11} color={colors.gold} />
                </View>
              ) : state === "unlocked" ? (
                <View style={styles.lockCorner}>
                  <Ionicons name="lock-open" size={11} color={colors.gold} />
                </View>
              ) : watched ? (
                <View style={styles.lockCorner}>
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={colors.textMuted}
                  />
                </View>
              ) : ratio === 0 ? (
                <View
                  style={[styles.corner, { backgroundColor: colors.primary }]}
                >
                  <AppText weight="bold" size={8} color="onPrimary">
                    {t("ep.free")}
                  </AppText>
                </View>
              ) : null}

              {/* started, not finished: thin bar at the bottom */}
              {ratio > 0 && !watched && (
                <View
                  style={[styles.track, { backgroundColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.max(6, ratio * 100)}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  ranges: { gap: 20, paddingBottom: 12 },
  underline: { height: 2, borderRadius: 1, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tile: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderBottomLeftRadius: 6,
  },
  lockCorner: { position: "absolute", top: 3, right: 4 },
  track: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3 },
  fill: { height: 3 },
});
