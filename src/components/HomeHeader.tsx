import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { AppText } from "./AppText";
import { CoinIcon } from "./CoinIcon";

// Two versions of the logo mark: white play triangle (dark theme) / dark play triangle (light theme)
/* eslint-disable @typescript-eslint/no-require-imports */
const LOGO_DARK = require("../../assets/images/logo-mark-dark.webp");
const LOGO_LIGHT = require("../../assets/images/logo-mark-light.webp");
/* eslint-enable @typescript-eslint/no-require-imports */

/** Home top bar: logo + name · VIP (gold coin) · search. */
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
      <Image
        source={colors.scheme === "dark" ? LOGO_DARK : LOGO_LIGHT}
        style={styles.logo}
        contentFit="contain"
        cachePolicy="memory"
      />
      <AppText weight="bold" size={20} style={styles.name}>
        Snap
        <AppText weight="bold" size={20} color="textAccent">
          Drama
        </AppText>
      </AppText>

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

      <Pressable
        onPress={onSearch}
        style={({ pressed }) => [
          styles.search,
          { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t("common.search")}
        hitSlop={6}
      >
        <Ionicons name="search" size={20} color={colors.text} />
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
  logo: { width: 32, height: 32 },
  name: { flex: 1 },
  vip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  search: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
