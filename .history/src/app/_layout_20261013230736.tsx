import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as Updates from "expo-updates";
import { useCallback, useEffect } from "react";
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
