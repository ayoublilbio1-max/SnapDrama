import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { FILTERS, type FilterId } from "../constants/home";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";

/** Popular · New · Hot · Categories · Anime. "Popular" is Home itself (active); the others open a page. */
export const FilterChips = memo(function FilterChips({
  onPress,
}: {
  onPress: (id: FilterId) => void;
}) {
  const colors = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {FILTERS.map((f) => {
        const active = f.id === "popular";
        return (
          <Pressable
            key={f.id}
            onPress={() => onPress(f.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {active && (
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <AppText
              weight={active ? "semibold" : "medium"}
              size={14}
              color={active ? "onPrimary" : "text"}
            >
              {f.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: { marginTop: 16, flexGrow: 0 },
  row: { paddingHorizontal: 16, gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
