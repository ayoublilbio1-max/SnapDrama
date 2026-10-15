import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { AppText } from "./AppText";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * Themed info popup (never the native Alert): icon in a soft circle, title, message,
 * optional accent button + Close. Used for "This is a demo", Feedback, notices.
 */
export function InfoModal({
  visible,
  icon = "information-circle-outline",
  title,
  message,
  children,
  actionLabel,
  onAction,
  closeLabel,
  onClose,
}: {
  visible: boolean;
  icon?: IconName;
  title: string;
  message: string;
  children?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  closeLabel?: string;
  onClose: () => void;
}) {
  const colors = useTheme();
  const t = useT();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => {}}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Ionicons
              name={icon}
              size={28}
              color={colors.scheme === "dark" ? colors.glow : colors.primary}
            />
          </View>
          <AppText weight="bold" size={19} align="center">
            {title}
          </AppText>
          <AppText
            size={14}
            color="textMuted"
            align="center"
            style={styles.message}
          >
            {message}
          </AppText>
          {children}
          {actionLabel && onAction ? (
            <Pressable
              onPress={onAction}
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <AppText weight="semibold" size={15} color="onPrimary">
                {actionLabel}
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: colors.surfaceAlt,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <AppText weight="semibold" size={15}>
              {closeLabel ?? t("common.close")}
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  message: { marginBottom: 10 },
  btn: {
    alignSelf: "stretch",
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
});
