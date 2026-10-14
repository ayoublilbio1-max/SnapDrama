import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, View } from "react-native";
import { darkColors } from "../../constants/colors";
import type { Series } from "../../data/types";
import { withAlpha } from "../../utils/color";
import { AppText } from "../AppText";
import { CoinIcon } from "../CoinIcon";

/** Page after the last free episode: blurred cover + lock + price + Unlock. */
export function LockedCard({
  series,
  n,
  price,
  height,
  onUnlock,
  onEpisodes,
}: {
  series: Series;
  n: number;
  price: number;
  height: number;
  onUnlock: () => void;
  onEpisodes: () => void;
}) {
  const c = darkColors;
  return (
    <View style={{ height, backgroundColor: c.background }}>
      <Image
        source={{ uri: series.cover }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={34}
      />
      <LinearGradient
        colors={[
          withAlpha(c.background, 0.55),
          withAlpha(c.background, 0.8),
          c.background,
        ]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <View style={[styles.cover, { borderColor: c.glow }]}>
          <Image
            source={{ uri: series.cover }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={[styles.lockBadge, { backgroundColor: c.overlay }]}>
            <Ionicons name="lock-closed" size={30} color={c.gold} />
          </View>
        </View>
        <AppText
          weight="bold"
          size={22}
          color="onPrimary"
          align="center"
          style={{ marginTop: 20 }}
        >
          Episode {n} is locked
        </AppText>
        <AppText
          size={14}
          align="center"
          numberOfLines={2}
          style={{ color: c.textMuted }}
        >
          {series.title} · {n} / {series.totalEpisodes}
        </AppText>

        <Pressable
          onPress={onUnlock}
          style={({ pressed }) => [
            styles.unlock,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <LinearGradient
            colors={c.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <AppText weight="bold" size={16} color="onPrimary">
            Unlock
          </AppText>
          <View style={[styles.price, { backgroundColor: c.overlay }]}>
            <CoinIcon size={20} glow={false} />
            <AppText weight="bold" size={16} style={{ color: c.gold }}>
              {price}
            </AppText>
          </View>
        </Pressable>

        <Pressable onPress={onEpisodes} hitSlop={8} style={styles.link}>
          <Ionicons name="albums-outline" size={16} color={c.textAccent} />
          <AppText weight="medium" size={14} style={{ color: c.textAccent }}>
            All episodes
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 4,
  },
  cover: {
    width: 150,
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  unlock: {
    marginTop: 24,
    height: 54,
    alignSelf: "stretch",
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  price: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  link: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 },
});
