import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { RowStyle } from "../constants/home";
import { freeLabel } from "../data/catalog";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";

type Props = {
  series: Series;
  width: number;
  variant?: RowStyle;
  rank?: number;
  onPress: (series: Series) => void;
};

/** Poster card (3:4) used in Home rows and grids. Memoized: rows re-render cheaply. */
export const SeriesCard = memo(function SeriesCard({
  series,
  width,
  variant = "default",
  rank,
  onPress,
}: Props) {
  const colors = useTheme();
  const height = Math.round((width * 4) / 3);

  return (
    <Pressable
      onPress={() => onPress(series)}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.8 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={series.title}
    >
      {/* the skeleton colour shows until the cover is loaded */}
      <View
        style={[
          styles.poster,
          { width, height, backgroundColor: colors.skeleton },
        ]}
      >
        <Image
          source={{ uri: series.cover }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
          recyclingKey={series.id}
        />
        <View style={[styles.badge, { backgroundColor: colors.overlay }]}>
          <AppText weight="semibold" size={10} color="onPrimary">
            {freeLabel(series)}
          </AppText>
        </View>
        {variant === "deal" && (
          <View style={[styles.deal, { backgroundColor: colors.gold }]}>
            <AppText weight="bold" size={10} color="onPrimary">
              DEAL
            </AppText>
          </View>
        )}
        {variant === "ranked" && rank ? (
          <AppText
            weight="bold"
            size={40}
            color="onPrimary"
            style={[styles.rank, { textShadowColor: colors.shade }]}
          >
            {rank}
          </AppText>
        ) : null}
      </View>
      <AppText
        weight="semibold"
        size={13}
        numberOfLines={2}
        style={styles.title}
      >
        {series.title}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  poster: { borderRadius: 14, overflow: "hidden" },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  deal: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  rank: {
    position: "absolute",
    left: 8,
    bottom: 0,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: { marginTop: 6 },
});
