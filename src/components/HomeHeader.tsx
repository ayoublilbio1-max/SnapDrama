import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { AppText } from "./AppText";
import { CoinIcon } from "./CoinIcon";

/** Home top bar: a wide search bar (opens the Search page) · VIP (gold coin). */
export function HomeHeader({
  onVip,
  onSearch,
}: {
  onVip: () => void;
  onSearch: () => void;
}) {
  const colors = useTheme();
  const t = useT();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onSearch}
        style={({ pressed }) => [
          styles.search,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="search"
        accessibilityLabel={t("common.search")}
        hitSlop={4}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <AppText
          size={15}
          color="textMuted"
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {t("search.placeholder")}
        </AppText>
      </Pressable>

      <Pressable
        onPress={onVip}
        style={({ pressed }) => [
          styles.vip,
          {
            backgroundColor: colors.goldSoft,
            borderColor: colors.gold,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="VIP"
        hitSlop={6}
      >
        <CoinIcon size={22} />
        <AppText weight="bold" size={13} style={{ color: colors.gold }}>
          VIP
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  search: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  vip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 42,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 21,
    borderWidth: 1,
  },
});
