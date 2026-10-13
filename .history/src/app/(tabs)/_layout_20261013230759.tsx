import { usePathname } from "expo-router";
import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarButton } from "../../components/TabBarButton";
import { darkColors } from "../../constants/colors";
import { useTheme } from "../../hooks/useTheme";

/**
 * Custom tab bar (headless expo-router tabs).
 * RULE: every screen file in (tabs) must have one TabTrigger here.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // The For You feed is a video screen → tab bar is always dark there.
  const colors = pathname === "/for-you" ? darkColors : theme;

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ]}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabBarButton
            icon="home"
            iconOutline="home-outline"
            label="Home"
            colors={colors}
          />
        </TabTrigger>
        <TabTrigger name="for-you" href="/for-you" asChild>
          <TabBarButton
            icon="play-circle"
            iconOutline="play-circle-outline"
            label="For you"
            colors={colors}
          />
        </TabTrigger>
        <TabTrigger name="rewards" href="/rewards" asChild>
          <TabBarButton
            icon="gift"
            iconOutline="gift-outline"
            label="Rewards"
            colors={colors}
          />
        </TabTrigger>
        <TabTrigger name="my-list" href="/my-list" asChild>
          <TabBarButton
            icon="bookmark"
            iconOutline="bookmark-outline"
            label="My list"
            colors={colors}
          />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabBarButton
            icon="person"
            iconOutline="person-outline"
            label="Profile"
            colors={colors}
          />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
