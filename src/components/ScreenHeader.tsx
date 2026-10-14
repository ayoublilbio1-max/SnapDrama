import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";

/** Back button + title for pushed pages (See all, filters, categories, VIP, search, series). */
export function ScreenHeader({
  title,
  right,
}: {
  title?: string;
  right?: ReactNode;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.row, { paddingTop: insets.top + 6 }]}>
      <Pressable
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
        style={({ pressed }) => [
          styles.back,
          { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      {title ? (
        <AppText weight="bold" size={20} numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
      ) : right ? null : (
        <View style={styles.title} />
      )}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1 },
});
