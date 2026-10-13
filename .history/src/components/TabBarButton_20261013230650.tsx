import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, StyleSheet } from "react-native";
import type { ThemeColors } from "../constants/colors";
import { AppText } from "./AppText";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = TabTriggerSlotProps & {
  icon: IconName; // solid icon (active)
  iconOutline: IconName; // stroke icon (inactive)
  label: string;
  colors: ThemeColors;
};

/** One button of the custom tab bar. Later: swap Ionicons for PNG/WebP icons from assets/icons. */
export function TabBarButton({
  icon,
  iconOutline,
  label,
  colors,
  isFocused,
  style,
  onPress,
  ...props
}: Props) {
  const tint = isFocused
    ? colors.scheme === "dark"
      ? colors.glow
      : colors.primary
    : colors.tabInactive;
  return (
    <Pressable
      {...props}
      onPress={(e) => {
        if (!isFocused) Haptics.selectionAsync().catch(() => {});
        if (__DEV__)
          console.log(`[tabs] → ${label}${isFocused ? " (already open)" : ""}`);
        onPress?.(e);
      }}
      style={styles.btn}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
    >
      <Ionicons name={isFocused ? icon : iconOutline} size={23} color={tint} />
      <AppText
        weight={isFocused ? "semibold" : "medium"}
        size={11}
        numberOfLines={1}
        style={{ color: tint }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingTop: 8,
    paddingBottom: 6,
  },
});
