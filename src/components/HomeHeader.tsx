import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";
import { CoinIcon } from "./CoinIcon";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const LOGO = require("../../assets/images/logo-mark.png");

/** Home top bar: logo + name · VIP (gold coin) · search. */
export function HomeHeader({
  onVip,
  onSearch,
}: {
  onVip: () => void;
  onSearch: () => void;
}) {
  const colors = useTheme();
  return (
    <View style={styles.row}>
      <Image
        source={LOGO}
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
        accessibilityLabel="Search"
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
