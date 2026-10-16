/**
 * SnapDrama colour tokens — the ONLY place hex values live.
 * Screens use `const colors = useTheme()` and these token names.
 */

// Brand palette (new logo: magenta → red → sunset orange on deep night purple)
export const palette = {
  magenta: "#E7237E", // Vibrant Magenta / Hot Pink — main accent, gradient start
  strawberry: "#FF254C", // Bright Strawberry Red — glow, second accent
  red: "#F31E37", // Vibrant Red — delete / destructive
  orange: "#FF5622", // Sunset Orange-Red — gradient end
  black: "#121212", // Matte Black — cards & containers (dark theme)
  deep: "#09011c", // App deep background (matches the logo background)
  white: "#FFFFFF",
  slate: "#94A3B8", // Secondary text
  blush: "#FF8DBE", // Soft pink — accent text / icons on dark
} as const;

export type ThemeColors = {
  scheme: "light" | "dark";
  background: string; // screen background
  surface: string; // cards, sheets, modals
  surfaceAlt: string; // chips, inputs, skeleton base
  border: string;
  text: string; // primary text / icons
  textMuted: string; // secondary text
  textAccent: string; // lavender accent text
  primary: string; // main accent (buttons, active tab)
  primaryAlt: string;
  glow: string;
  gradient: readonly [string, string];
  onPrimary: string; // text on primary buttons
  danger: string;
  onDanger: string;
  success: string; // "You're back online", positive toasts
  onSuccess: string;
  overlay: string; // modal backdrop
  tabBar: string; // floating pill background (white in light, dark card in dark)
  tabBarBorder: string; // thin outline of the pill (violet glow in dark)
  tabIcon: string; // inactive tab icon (outline)
  tabCutout: string; // details drawn inside the solid active icon
  tabInactive: string;
  skeleton: string;
  skeletonHighlight: string;
  gold: string; // VIP / coins text
  goldGlow: string; // glow behind the coin
  goldSoft: string; // soft gold background (VIP pill, deal badge)
  shade: string; // text shadow on top of posters
};

export const darkColors: ThemeColors = {
  scheme: "dark",
  background: palette.deep,
  surface: palette.black,
  surfaceAlt: "#1F1B23",
  border: "rgba(231, 35, 126, 0.22)",
  text: palette.white,
  textMuted: palette.slate,
  textAccent: palette.blush,
  primary: palette.magenta,
  primaryAlt: palette.strawberry,
  glow: palette.strawberry,
  gradient: [palette.magenta, palette.orange],
  onPrimary: palette.white,
  danger: palette.red,
  onDanger: palette.white,
  success: "#22C55E",
  onSuccess: palette.white,
  overlay: "rgba(5, 0, 12, 0.72)",
  tabBar: palette.black,
  tabBarBorder: "rgba(231, 35, 126, 0.35)",
  tabIcon: palette.blush,
  tabCutout: palette.magenta,
  tabInactive: "#6E6670",
  skeleton: "#1A171D",
  skeletonHighlight: "#28232C",
  gold: "#FFC83D",
  goldGlow: "rgba(255, 200, 61, 0.55)",
  goldSoft: "rgba(255, 200, 61, 0.14)",
  shade: "rgba(0, 0, 0, 0.6)",
};

export const lightColors: ThemeColors = {
  scheme: "light",
  background: "#FFF5F8",
  surface: palette.white,
  surfaceAlt: "#FCE4EE",
  border: "#F5D2E1",
  text: palette.black,
  textMuted: "#6B6470",
  textAccent: palette.magenta,
  primary: palette.magenta,
  primaryAlt: palette.strawberry,
  glow: palette.strawberry,
  gradient: [palette.magenta, palette.orange],
  onPrimary: palette.white,
  danger: palette.red,
  onDanger: palette.white,
  success: "#16A34A",
  onSuccess: palette.white,
  overlay: "rgba(18, 18, 18, 0.45)",
  tabBar: palette.white,
  tabBarBorder: "transparent",
  tabIcon: palette.black,
  tabCutout: palette.magenta,
  tabInactive: "#A39AA6",
  skeleton: "#F8E6EE",
  skeletonHighlight: "#FDF2F6",
  gold: "#B7791F",
  goldGlow: "rgba(245, 179, 1, 0.45)",
  goldSoft: "rgba(245, 179, 1, 0.16)",
  shade: "rgba(0, 0, 0, 0.55)",
};
