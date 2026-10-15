import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarButton } from "../../components/TabBarButton";
import type { TabIconName } from "../../components/TabIcons";
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from "../../constants/layout";
import { useTheme } from "../../hooks/useTheme";
import { useT, type Key } from "../../i18n";

// Props that expo-router's <Tabs> passes to a custom tabBar (no extra package import needed)
type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

/**
 * Tab config. RULE: every screen file in (tabs) must have an entry here
 * (key = file name without .tsx) AND a <Tabs.Screen> below.
 */
const TAB_CONFIG: Record<string, { icon: TabIconName; label: Key }> = {
  index: { icon: "home", label: "tabs.home" },
  "for-you": { icon: "shorts", label: "tabs.forYou" },
  rewards: { icon: "rewards", label: "tabs.rewards" },
  "my-list": { icon: "mylist", label: "tabs.myList" },
  profile: { icon: "profile", label: "tabs.profile" },
};

/** Floating white pill bar drawn over the screens. */
function PillTabBar({ state, navigation }: TabBarProps) {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;
  const [barWidth, setBarWidth] = useState(0);

  // Exact widths: the active pill gets a fixed share, the other tabs split the rest equally.
  const tabCount = state.routes.filter((r) => TAB_CONFIG[r.name]).length;
  const inner = Math.max(0, barWidth - BAR_PADDING * 2 - GAP * (tabCount - 1));
  const activeWidth = Math.min(ACTIVE_MAX, inner * 0.42);
  const idleWidth =
    tabCount > 1 ? (inner - activeWidth) / (tabCount - 1) : inner;

  useEffect(() => {
    if (__DEV__ && barWidth > 0)
      console.log(
        `[tabs] bar shown — active "${activeName}", ${tabCount} tabs, bar ${Math.round(barWidth)}dp, ` +
          `active ${Math.round(activeWidth)}dp, others ${Math.round(idleWidth)}dp`,
      );
  }, [activeName, tabCount, barWidth, activeWidth, idleWidth]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_GAP }]}
    >
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.tabBar, borderColor: colors.tabBarBorder },
        ]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {barWidth > 0 &&
          state.routes.map((route, i) => {
            const cfg = TAB_CONFIG[route.name];
            if (!cfg) {
              if (__DEV__)
                console.log(
                  `[tabs] no TAB_CONFIG entry for "${route.name}" — skipped`,
                );
              return null;
            }
            const focused = state.index === i;
            return (
              <TabBarButton
                key={route.key}
                icon={cfg.icon}
                label={t(cfg.label)}
                colors={colors}
                isFocused={focused}
                width={focused ? activeWidth : idleWidth}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
              />
            );
          })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      // freezeOnBlur: tabs you are not looking at stop re-rendering (faster); lazy: a tab is built on first visit
      screenOptions={{ headerShown: false, freezeOnBlur: true, lazy: true }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="for-you" />
      <Tabs.Screen name="rewards" />
      <Tabs.Screen name="my-list" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const BAR_PADDING = 6;
const GAP = 2;
const ACTIVE_MAX = 140;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    paddingHorizontal: BAR_PADDING,
    flexDirection: "row",
    alignItems: "center",
    gap: GAP,
    overflow: "hidden",
    borderWidth: 1,
    // soft shadow so the white pill also stands out on the light theme
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
});
