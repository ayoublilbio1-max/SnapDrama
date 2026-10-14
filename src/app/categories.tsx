import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { ScreenHeader } from "../components/ScreenHeader";
import { CATEGORIES } from "../constants/home";
import { seriesByTag, useCatalog } from "../data/catalog";
import { useTheme } from "../hooks/useTheme";

/** All categories (2 columns). Tap → the series that have this tag. */
export default function CategoriesScreen() {
  const colors = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { catalog } = useCatalog();
  const tileW = Math.floor((width - 16 * 2 - 12) / 2);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((c) => [c, seriesByTag(catalog, c).length]),
      ),
    [catalog],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Categories" />
      <ScrollView
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {CATEGORIES.map((c, i) => (
          <Pressable
            key={c}
            onPress={() => {
              if (__DEV__) console.log(`[categories] open ${c} (${counts[c]})`);
              router.push({
                pathname: "/browse",
                params: { kind: "category", value: c, title: c },
              });
            }}
            style={({ pressed }) => [
              styles.tile,
              {
                width: tileW,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {i % 3 === 0 && (
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}
              />
            )}
            <AppText weight="bold" size={16}>
              {c}
            </AppText>
            <AppText size={12} color="textMuted">
              {counts[c] ? `${counts[c]} series` : "No series yet"}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  tile: {
    height: 84,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
});
