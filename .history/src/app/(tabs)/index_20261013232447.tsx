import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { AppText } from "../../components/AppText";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ScreenPlaceholder } from "../../components/ScreenPlaceholder";
import { useTheme } from "../../hooks/useTheme";

export default function HomeScreen() {
  const colors = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <ScreenPlaceholder
      title="Home"
      subtitle="Base setup v0.1.0 — theme, font, tabs and modal are ready. Home is the next step."
      icon="home"
      colors={colors}
    >
      {/* Font check: all 5 weights */}
      <AppText weight="light" size={16}>
        Light — Billionaire's secret bride
      </AppText>
      <AppText weight="regular" size={16}>
        Regular — Billionaire's secret bride
      </AppText>
      <AppText weight="medium" size={16}>
        Medium — Billionaire's secret bride
      </AppText>
      <AppText weight="semibold" size={16}>
        Semibold — Billionaire's secret bride
      </AppText>
      <AppText weight="bold" size={16}>
        Bold — Billionaire's secret bride
      </AppText>

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <AppText weight="semibold" color="onPrimary">
          Test ConfirmModal
        </AppText>
      </Pressable>

      <ConfirmModal
        visible={open}
        title="Remove from My list?"
        message="This series will be removed from your list. You can add it again any time."
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </ScreenPlaceholder>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginTop: 18,
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
