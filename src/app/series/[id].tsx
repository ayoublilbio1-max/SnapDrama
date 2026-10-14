import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { EmptyState } from "../../components/EmptyState";
import { ScreenHeader } from "../../components/ScreenHeader";
import { freeLabel, useSeries } from "../../data/catalog";
import { useTheme } from "../../hooks/useTheme";
import { formatCount } from "../../utils/format";

/**
 * Series page — base version (cover, title, info).
 * Episodes list, unlock sheet and player are the next steps.
 */
export default function SeriesScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const series = useSeries(id);

  if (!series) {
    if (__DEV__) console.log(`[series] not found: ${id}`);
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader />
        <EmptyState
          text="This series is not available"
          icon="alert-circle-outline"
        />
      </View>
    );
  }

  const coverW = Math.round(width * 0.5);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader />
      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View
          style={[
            styles.cover,
            {
              width: coverW,
              height: Math.round((coverW * 4) / 3),
              backgroundColor: colors.skeleton,
            },
          ]}
        >
          <Image
            source={{ uri: series.cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        </View>
        <AppText
          weight="bold"
          size={22}
          align="center"
          style={{ marginTop: 16 }}
        >
          {series.title}
        </AppText>
        <AppText size={13} color="textMuted" align="center">
          ★ {series.rating} ({formatCount(series.ratingCount)}) ·{" "}
          {freeLabel(series)} · {series.totalEpisodes} episodes
        </AppText>
        {series.description ? (
          <AppText size={14} align="center" style={{ marginTop: 12 }}>
            {series.description}
          </AppText>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { borderRadius: 18, overflow: "hidden" },
});
