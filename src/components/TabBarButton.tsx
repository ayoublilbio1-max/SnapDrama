import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ThemeColors } from "../constants/colors";
import { AppText } from "./AppText";
import { TabIcon, type TabIconName } from "./TabIcons";

type Props = {
  icon: TabIconName;
  label: string;
  colors: ThemeColors;
  isFocused: boolean;
  width: number; // exact width given by the bar (active pill or idle slot)
  onPress: () => void;
};

/**
 * One tab of the floating pill bar.
 * Active: gradient pill (violet → indigo) + solid white icon + label.
 * Inactive: outline icon only.
 * Only the width animates (exact numbers from the bar), so tabs can never be pushed out.
 */
export function TabBarButton({
  icon,
  label,
  colors,
  isFocused,
  width,
  onPress,
}: Props) {
  const w = useSharedValue(width);

  useEffect(() => {
    w.value = withTiming(width, { duration: 220 });
  }, [width, w]);

  const animStyle = useAnimatedStyle(() => ({ width: w.value }));

  return (
    <Animated.View style={[styles.slot, animStyle]}>
      <Pressable
        onPress={() => {
          if (!isFocused) Haptics.selectionAsync().catch(() => {});
          if (__DEV__)
            console.log(
              `[tabs] → ${label}${isFocused ? " (already open)" : ""}`,
            );
          onPress();
        }}
        style={styles.btn}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: isFocused }}
      >
        {isFocused && (
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <TabIcon
          name={icon}
          active={isFocused}
          size={24}
          color={isFocused ? colors.onPrimary : colors.tabIcon}
          cutout={colors.tabCutout}
        />
        {isFocused && (
          <Animated.View
            entering={FadeIn.duration(180).delay(80)}
            style={styles.labelWrap}
          >
            <AppText
              weight="semibold"
              size={14}
              numberOfLines={1}
              color="onPrimary"
            >
              {label}
            </AppText>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: { height: 52 },
  btn: {
    flex: 1,
    borderRadius: 26,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  labelWrap: { flexShrink: 1 },
});
