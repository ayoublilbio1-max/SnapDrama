import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { isEpisodeFree } from "../data/catalog";
import { episodeView, progressKey, useProgress } from "../data/progress";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";

const PER_RANGE = 30; // tabs: 1-30, 31-60…
const COLUMNS = 5;
const GAP = 8;

export type EpisodeState = "free" | "locked";

/**
 * Episode numbers 1..totalEpisodes (brief §8): free ones playable, the others locked with a price.
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
  const progress = useProgress();
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
          const free = isEpisodeFree(series, n);
          const { watched, ratio } = free
            ? episodeView(progress[progressKey(series.id, n)])
            : { watched: false, ratio: 0 };
          const isCurrent = n === current;
          return (
            <Pressable
              key={n}
              onPress={() => onPress(n, free ? "free" : "locked")}
              style={({ pressed }) => [
                styles.tile,
                {
                  width: tileW,
                  backgroundColor: watched ? colors.surfaceAlt : colors.surface,
                  borderColor: isCurrent
                    ? colors.primary
                    : free
                      ? colors.border
                      : colors.goldSoft,
                  borderWidth: isCurrent ? 1.5 : 1,
                  opacity: pressed ? 0.7 : watched && !isCurrent ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                free
                  ? `Episode ${n}${watched ? ", watched" : ratio > 0 ? `, ${Math.round(ratio * 100)}% watched` : ""}`
                  : `Episode ${n}, locked, ${coinsPerEpisode} coins`
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

              {!free ? (
                <View style={styles.lockCorner}>
                  <Ionicons name="lock-closed" size={11} color={colors.gold} />
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
                    FREE
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
