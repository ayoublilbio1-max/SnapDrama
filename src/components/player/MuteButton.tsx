import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet } from "react-native";
import { darkColors } from "../../constants/colors";
import { toggleMuted, useMuted } from "../../video/mute";

/** Round 🔊 / 🔇 button for the top bar of the player and the feed. */
export function MuteButton() {
  const c = darkColors;
  const muted = useMuted();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        toggleMuted();
      }}
      hitSlop={10}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: c.overlay, opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={muted ? "Turn sound on" : "Mute"}
    >
      <Ionicons
        name={muted ? "volume-mute" : "volume-high"}
        size={20}
        color={c.onPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
