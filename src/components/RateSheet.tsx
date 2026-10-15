import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useT, type Key } from "../i18n";
import { AppText } from "./AppText";

const LABELS: Key[] = [
  "rate.l1",
  "rate.l1",
  "rate.l2",
  "rate.l3",
  "rate.l4",
  "rate.l5",
];

/** Bottom sheet with 1–5 stars (a series, or the app in Settings › Rate us). The tester can change their stars later. */
export function RateSheet({
  visible,
  title,
  heading,
  current,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  heading?: string; // default "Rate this series"
  current: number;
  onSubmit: (stars: number) => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(current);

  useEffect(() => {
    if (visible) setStars(current);
  }, [visible, current]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText weight="bold" size={18} align="center">
            {heading ?? t("rate.series")}
          </AppText>
          <AppText size={13} color="textMuted" align="center" numberOfLines={1}>
            {title}
          </AppText>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                hitSlop={6}
                onPress={() => {
                  setStars(n);
                  Haptics.selectionAsync().catch(() => {});
                }}
                accessibilityRole="button"
                accessibilityLabel={`${n} stars`}
              >
                <Ionicons
                  name={n <= stars ? "star" : "star-outline"}
                  size={38}
                  color={colors.gold}
                />
              </Pressable>
            ))}
          </View>
          <AppText
            weight="medium"
            size={14}
            align="center"
            style={{ minHeight: 20, color: colors.gold }}
          >
            {stars ? t(LABELS[stars]) : ""}
          </AppText>

          <Pressable
            disabled={!stars}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
              onSubmit(stars);
            }}
            style={({ pressed }) => [
              styles.btn,
              { opacity: !stars ? 0.4 : pressed ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <AppText weight="semibold" size={15} color="onPrimary">
              {current ? t("rate.update") : t("rate.submit")}
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    gap: 6,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 6,
  },
  btn: {
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
});
