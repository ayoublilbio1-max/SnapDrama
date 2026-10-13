/**
 * SnapDrama colour tokens — the ONLY place hex values live.
 * Screens use `const colors = useTheme()` and these token names.
 */

// Brand palette (from the brief / logo)
export const palette = {
  violet: '#7C3AED', // Electric Violet (gradient start)
  indigo: '#6366F1', // Indigo (gradient end)
  glow: '#8B5CF6', // Vibrant purple border / glow
  deep: '#09011c', // App deep background (matches the logo background)
  card: '#19112C', // Card & container background
  white: '#FFFFFF',
  slate: '#94A3B8', // Secondary text
  lavender: '#A78BFA', // Muted accent text
  canvas: '#D8C9F3', // Canvas (light surfaces)
  danger: '#EF4444', // Delete / destructive
} as const;

export type ThemeColors = {
  scheme: 'light' | 'dark';
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
  overlay: string; // modal backdrop
  tabBar: string; // floating pill background (white in light, dark card in dark)
  tabBarBorder: string; // thin outline of the pill (violet glow in dark)
  tabIcon: string; // inactive tab icon (outline)
  tabCutout: string; // details drawn inside the solid active icon
  tabInactive: string;
  skeleton: string;
  skeletonHighlight: string;
};

export const darkColors: ThemeColors = {
  scheme: 'dark',
  background: palette.deep,
  surface: palette.card,
  surfaceAlt: '#241A3D',
  border: 'rgba(139, 92, 246, 0.22)',
  text: palette.white,
  textMuted: palette.slate,
  textAccent: palette.lavender,
  primary: palette.violet,
  primaryAlt: palette.indigo,
  glow: palette.glow,
  gradient: [palette.violet, palette.indigo],
  onPrimary: palette.white,
  danger: palette.danger,
  onDanger: palette.white,
  overlay: 'rgba(5, 0, 16, 0.72)',
  tabBar: palette.card,
  tabBarBorder: 'rgba(139, 92, 246, 0.35)',
  tabIcon: palette.lavender,
  tabCutout: palette.violet,
  tabInactive: '#6B6585',
  skeleton: '#1D1433',
  skeletonHighlight: '#2A1F47',
};

export const lightColors: ThemeColors = {
  scheme: 'light',
  background: '#F6F2FD',
  surface: palette.white,
  surfaceAlt: palette.canvas,
  border: '#E3D8F6',
  text: palette.card,
  textMuted: '#64748B',
  textAccent: palette.violet,
  primary: palette.violet,
  primaryAlt: palette.indigo,
  glow: palette.glow,
  gradient: [palette.violet, palette.indigo],
  onPrimary: palette.white,
  danger: '#DC2626',
  onDanger: palette.white,
  overlay: 'rgba(25, 17, 44, 0.45)',
  tabBar: palette.white,
  tabBarBorder: 'transparent',
  tabIcon: palette.card,
  tabCutout: palette.violet,
  tabInactive: '#9A93B5',
  skeleton: '#EAE2F8',
  skeletonHighlight: '#F4EFFC',
};
