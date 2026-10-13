import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarButton } from "../../components/TabBarButton";
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from "../../constants/layout";
import { useTheme } from "../../hooks/useTheme";

/**
 * Custom floating pill tab bar (headless expo-router tabs).
 * RULE: every screen file in (tabs) must have one TabTrigger here.
 */
export default function TabsLayout() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            bottom: insets.bottom + TAB_BAR_GAP,
          },
        ]}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabBarButton icon="home" label="Home" colors={colors} />
        </TabTrigger>
        <TabTrigger name="for-you" href="/for-you" asChild>
          <TabBarButton icon="shorts" label="For you" colors={colors} />
        </TabTrigger>
        <TabTrigger name="rewards" href="/rewards" asChild>
          <TabBarButton icon="rewards" label="Rewards" colors={colors} />
        </TabTrigger>
        <TabTrigger name="my-list" href="/my-list" asChild>
          <TabBarButton icon="mylist" label="My list" colors={colors} />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabBarButton icon="profile" label="Profile" colors={colors} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    // soft shadow so the white pill also stands out on the light theme
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
});
