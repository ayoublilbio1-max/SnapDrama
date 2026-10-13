import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";
import type { ThemeColors } from "../constants/colors";
import { useTheme } from "../hooks/useTheme";

export type FontWeightName =
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold";

// On Android the font family = the TTF file name (embedded by the expo-font plugin).
export const FONT: Record<FontWeightName, string> = {
  light: "BricolageGrotesque-Light",
  regular: "BricolageGrotesque-Regular",
  medium: "BricolageGrotesque-Medium",
  semibold: "BricolageGrotesque-Semibold",
  bold: "BricolageGrotesque-Bold",
};

type ColorToken = Exclude<keyof ThemeColors, "scheme" | "gradient">;

export type AppTextProps = TextProps & {
  weight?: FontWeightName;
  size?: number;
  color?: ColorToken;
  align?: TextStyle["textAlign"];
};

/** Use instead of <Text> everywhere: sets font, colour and a safe lineHeight (1.4 × size). */
export function AppText({
  weight = "regular",
  size = 15,
  color = "text",
  align,
  style,
  ...rest
}: AppTextProps) {
  const colors = useTheme();
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontSize = flat.fontSize ?? size;
  const lineHeight = flat.lineHeight ?? Math.round(fontSize * 1.4);

  if (__DEV__ && flat.fontWeight) {
    console.log(
      `[text] fontWeight "${String(flat.fontWeight)}" ignored — use weight="bold" etc.`,
    );
  }

  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: FONT[weight],
          fontSize,
          lineHeight,
          color: colors[color] as string,
          textAlign: align,
        },
        style,
        // always last: never let fontWeight fight the font file, keep the safe lineHeight
        { fontWeight: "normal", lineHeight },
      ]}
    />
  );
}
