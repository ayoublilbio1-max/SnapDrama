import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useTheme } from "../hooks/useTheme";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const COIN = require("../../assets/images/coin_icon.webp");

/** The SnapDrama gold coin with a soft golden glow behind it (VIP / coins). */
export function CoinIcon({
  size = 26,
  glow = true,
}: {
  size?: number;
  glow?: boolean;
}) {
  const colors = useTheme();
  const g = size * 1.9; // glow area
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {glow && (
        <Svg
          width={g}
          height={g}
          style={[styles.glow, { left: (size - g) / 2, top: (size - g) / 2 }]}
        >
          <Defs>
            <RadialGradient id="coinGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.goldGlow} stopOpacity={1} />
              <Stop
                offset="0.55"
                stopColor={colors.goldGlow}
                stopOpacity={0.35}
              />
              <Stop offset="1" stopColor={colors.goldGlow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={g / 2} cy={g / 2} r={g / 2} fill="url(#coinGlow)" />
        </Svg>
      )}
      <Image
        source={COIN}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: "absolute" },
});
