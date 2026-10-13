import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import type { ThemeColors } from "../constants/colors";
import { AppText } from "./AppText";
import { TabIcon, type TabIconName } from "./TabIcons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const LAYOUT = LinearTransition.springify().damping(20).stiffness(220);

type Props = TabTriggerSlotProps & {
  icon: TabIconName;
  label: string;
  colors: ThemeColors;
};

/**
 * One tab of the floating pill bar.
 * Active: gradient pill (violet → indigo) + solid white icon + label.
 * Inactive: outline icon only.
 */
export function TabBarButton({
  icon,
  label,
  colors,
  isFocused,
  style,
  onPress,
  ...props
}: Props) {
  return (
    <AnimatedPressable
      {...props}
      layout={LAYOUT}
      onPress={(e) => {
        if (!isFocused) Haptics.selectionAsync().catch(() => {});
        if (__DEV__)
          console.log(`[tabs] → ${label}${isFocused ? " (already open)" : ""}`);
        onPress?.(e);
      }}
      style={[styles.btn, isFocused ? styles.btnActive : styles.btnIdle]}
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
        <Animated.View entering={FadeIn.duration(180)}>
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
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnActive: { paddingHorizontal: 18, flexGrow: 0, flexShrink: 0 },
  btnIdle: { flex: 1, minWidth: 44 },
});
