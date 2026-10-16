import * as NavigationBar from "expo-navigation-bar";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { AppState, LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { OfflineGate } from "../components/OfflineGate";
import { darkColors } from "../constants/colors";
import { CatalogProvider, useCatalog } from "../data/catalog";
import { preloadDownloads } from "../data/downloads";
import { preloadHistory } from "../data/history";
import { preloadProgress } from "../data/progress";
import { preloadRewards } from "../data/rewards";
import { initSettings } from "../data/settings";
import { preloadUserState } from "../data/userStore";
import { preloadVip } from "../data/vip";
import { preloadWallet } from "../data/wallet";
import { useTheme } from "../hooks/useTheme";
import { NotificationsGate } from "../notifications/NotificationsGate";
import { navArrived } from "../utils/navLock";

// Outside the component (brief §5): keep the splash until the app is ready.
SplashScreen.preventAutoHideAsync().catch(() => {});
// Dev only: expo-router's own start-up warning (its link check answers a split second before the first
// screen is mounted, when the first bundle is slow). Harmless, not from our code → no red box in dev.
// Release builds (preview / production) never show the red box at all.
LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet",
]);
SplashScreen.setOptions({ duration: 300, fade: true });
preloadUserState(); // saves / ratings ready before the first series page
preloadHistory(); // continue watching ready before Home
preloadProgress(); // watched / started episodes
preloadWallet(); // demo coins + unlocked episodes
preloadVip(); // demo VIP plan (+ daily VIP coins)
preloadRewards(); // check-in streak + tasks
preloadDownloads(); // offline episodes
initSettings(); // chosen theme (System / Light / Dark) applied before the first frame

const t0 = Date.now();
let splashHidden = false; // module-level guard → hideAsync() runs ONCE only
const SPLASH_MAX_MS = 3000; // safety: never keep the splash longer than this

function hideSplashOnce(why: string) {
  if (splashHidden) return;
  splashHidden = true;
  SplashScreen.hideAsync()
    .then(() => {
      if (__DEV__)
        console.log(`[splash] hidden after ${Date.now() - t0}ms (${why})`);
    })
    .catch(() => {});
}

/** Hides the splash ONCE, when the first catalog copy is loaded (brief §5). */
function SplashGate() {
  const { status } = useCatalog();
  useEffect(() => {
    if (status === "ready") hideSplashOnce("catalog ready");
  }, [status]);
  useEffect(() => {
    const t = setTimeout(() => hideSplashOnce("timeout"), SPLASH_MAX_MS);
    return () => clearTimeout(t);
  }, []);
  return null;
}

export default function RootLayout() {
  const colors = useTheme();
  const pathname = usePathname();

  // a page finished opening → taps are accepted again (double-tap guard, src/utils/navLock.ts)
  useEffect(() => {
    navArrived(pathname);
  }, [pathname]);

  useEffect(() => {
    if (__DEV__) console.log(`[app] theme ${colors.scheme}`);
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

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <CatalogProvider>
        <SplashGate />
        <KeyboardProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              // pushed pages (series, See all, VIP, search…) slide in fast
              animation: "slide_from_right",
              animationDuration: 220,
              gestureEnabled: true,
              // screens under the top one stop re-rendering (Home doesn't redraw behind the player)
              freezeOnBlur: true,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen
              name="search"
              options={{ animation: "fade_from_bottom" }}
            />
            <Stack.Screen
              name="watch/[id]"
              options={{
                animation: "fade",
                contentStyle: { backgroundColor: darkColors.background },
              }}
            />
          </Stack>
        </KeyboardProvider>
        <OfflineGate />
        <NotificationsGate />
      </CatalogProvider>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
