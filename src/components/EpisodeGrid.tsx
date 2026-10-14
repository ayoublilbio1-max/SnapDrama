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
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";

const PER_RANGE = 30; // tabs: 1-30, 31-60…
const COLUMNS = 5;
const GAP = 8;

export type EpisodeState = "free" | "locked";

/**
 * Episode numbers 1..totalEpisodes (brief §8): free ones playable, the others locked with a price.
 * Only free episodes have a video; the app creates the locked ones itself.
 */
export const EpisodeGrid = memo(function EpisodeGrid({
  series,
  coinsPerEpisode,
  onPress,
}: {
  series: Series;
  coinsPerEpisode: number;
  onPress: (n: number, state: EpisodeState) => void;
}) {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const total = series.totalEpisodes;
  const ranges = useMemo(() => {
    const r: [number, number][] = [];
    for (let a = 1; a <= total; a += PER_RANGE)
      r.push([a, Math.min(total, a + PER_RANGE - 1)]);
    return r;
  }, [total]);
  const [range, setRange] = useState(0);
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
          return (
            <Pressable
              key={n}
              onPress={() => onPress(n, free ? "free" : "locked")}
              style={({ pressed }) => [
                styles.tile,
                {
                  width: tileW,
                  backgroundColor: colors.surface,
                  borderColor: free ? colors.border : colors.goldSoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                free
                  ? `Episode ${n}`
                  : `Episode ${n}, locked, ${coinsPerEpisode} coins`
              }
            >
              <AppText weight="semibold" size={16}>
                {n}
              </AppText>
              {free ? (
                <View
                  style={[styles.corner, { backgroundColor: colors.primary }]}
                >
                  <AppText weight="bold" size={8} color="onPrimary">
                    FREE
                  </AppText>
                </View>
              ) : (
                <View style={styles.lockCorner}>
                  <Ionicons name="lock-closed" size={11} color={colors.gold} />
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
    borderWidth: 1,
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
});
