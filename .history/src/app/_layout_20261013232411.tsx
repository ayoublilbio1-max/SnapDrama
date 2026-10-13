import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as Updates from "expo-updates";
import { useCallback, useEffect } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useTheme } from "../hooks/useTheme";

// Outside the component (brief §5): keep the splash until the app is ready.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

const t0 = Date.now();
let splashHidden = false; // module-level guard → hideAsync() runs ONCE only

export default function RootLayout() {
  const colors = useTheme();

  useEffect(() => {
    if (__DEV__) console.log(`[app] start — theme ${colors.scheme}`);
  }, [colors.scheme]);

  // Android buttons/gesture bar: hidden all the time. Swiping up from the bottom shows it for a moment.
  // Re-hide when the app comes back to the front (Android shows it again after background).
  // Never use the <NavigationBar hidden /> component (Playtune bug: "activity no longer available").
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const hide = (why: string) =>
      NavigationBar.setVisibilityAsync("hidden")
        .then(() => {
          if (__DEV__) console.log(`[navbar] hidden (${why})`);
        })
        .catch((e) => {
          if (__DEV__) console.log("[navbar] hide failed", String(e));
        });
    hide("start");
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") hide("back to app");
    });
    return () => sub.remove();
  }, []);

  // Which JS is running: the one inside the APK, or an EAS Update (preview/production only)
  useEffect(() => {
    if (__DEV__) {
      console.log(
        "[updates] dev build — JS comes from Metro, EAS Update is off",
      );
      return;
    }
    console.log(
      `[updates] channel=${Updates.channel ?? "-"} runtime=${Updates.runtimeVersion ?? "-"} ` +
        `update=${Updates.isEmbeddedLaunch ? "embedded (from the APK)" : Updates.updateId}`,
    );
  }, []);

  // Root view colour behind every screen (avoids white flashes on navigation)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  // v0.1: hide on first layout. Later (catalog step): hide when the first catalog copy is loaded.
  const hideSplashOnce = useCallback(() => {
    if (splashHidden) return;
    splashHidden = true;
    SplashScreen.hideAsync()
      .then(() => {
        if (__DEV__) console.log(`[splash] hidden after ${Date.now() - t0}ms`);
      })
      .catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
      onLayout={hideSplashOnce}
    >
      <KeyboardProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </KeyboardProvider>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
