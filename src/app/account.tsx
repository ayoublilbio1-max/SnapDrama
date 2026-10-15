import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { ConfirmModal } from "../components/ConfirmModal";
import { InfoModal } from "../components/InfoModal";
import { ScreenHeader } from "../components/ScreenHeader";
import { FIVERR_URL } from "../constants/app";
import { deleteAllData } from "../data/reset";
import { useSettings } from "../data/settings";
import { useTheme } from "../hooks/useTheme";
import { useT, type Key } from "../i18n";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
const PROVIDERS: { id: string; icon: IconName; label: Key }[] = [
  { id: "google", icon: "logo-google", label: "account.google" },
  { id: "apple", icon: "logo-apple", label: "account.apple" },
  { id: "email", icon: "mail-outline", label: "account.email" },
  { id: "facebook", icon: "logo-facebook", label: "account.facebook" },
];

/**
 * Account management (demo): link Google / Apple / Email / Facebook and "find my account"
 * open a themed "Not in the demo" popup; "Delete account" really wipes this phone's data.
 */
export default function AccountScreen() {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [demo, setDemo] = useState<string | null>(null); // message of the "Not in the demo" popup
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = settings.name === "Guest" ? t("profile.guest") : settings.name;

  const notInDemo = (what: string) => {
    if (__DEV__) console.log(`[account] ${what} → not in the demo`);
    setDemo(what);
  };

  const onDelete = async () => {
    setConfirm(false);
    setDeleting(true);
    try {
      await deleteAllData();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t("account.title")} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* who */}
        <View
          style={[
            styles.who,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
            {settings.avatar ? (
              <Image
                source={{ uri: settings.avatar }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={26} color={colors.textAccent} />
            )}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="bold" size={17} numberOfLines={1}>
              {name}
            </AppText>
            <AppText size={12} color="textMuted">
              {t("account.guestStatus")} · ID {settings.userId}
            </AppText>
          </View>
        </View>
        <AppText size={13} color="textMuted" style={styles.note}>
          {t("account.localNote")}
        </AppText>

        {/* link */}
        <AppText
          weight="bold"
          size={14}
          color="textMuted"
          style={styles.section}
        >
          {t("account.linkTitle")}
        </AppText>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {PROVIDERS.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() =>
                notInDemo(t("account.linkDemo", { provider: t(p.label) }))
              }
              style={({ pressed }) => [
                styles.row,
                i < PROVIDERS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}
              >
                <Ionicons name={p.icon} size={18} color={colors.text} />
              </View>
              <AppText weight="medium" size={15} style={{ flex: 1 }}>
                {t("account.linkWith", { provider: t(p.label) })}
              </AppText>
              <AppText size={12} color="textMuted">
                {t("account.notLinked")}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* find */}
        <Pressable
          onPress={() => notInDemo(t("account.findDemo"))}
          style={({ pressed }) => [
            styles.single,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textAccent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="medium" size={15}>
              {t("account.find")}
            </AppText>
            <AppText size={12} color="textMuted">
              {t("account.findHint")}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {/* delete */}
        <AppText
          weight="bold"
          size={14}
          color="textMuted"
          style={styles.section}
        >
          {t("account.dangerTitle")}
        </AppText>
        <Pressable
          disabled={deleting}
          onPress={() => setConfirm(true)}
          style={({ pressed }) => [
            styles.single,
            {
              backgroundColor: colors.surface,
              borderColor: colors.danger,
              opacity: deleting ? 0.5 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <View
            style={[styles.icon, { backgroundColor: colors.danger + "22" }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" size={15} color="danger">
              {deleting ? t("account.deleting") : t("account.delete")}
            </AppText>
            <AppText size={12} color="textMuted">
              {t("account.deleteHint")}
            </AppText>
          </View>
        </Pressable>
      </ScrollView>

      <InfoModal
        visible={!!demo}
        icon="person-circle-outline"
        title={t("demo.notInDemo")}
        message={demo ?? ""}
        actionLabel={t("common.contactDev")}
        onAction={() => {
          setDemo(null);
          Linking.openURL(FIVERR_URL).catch(() => {});
        }}
        onClose={() => setDemo(null)}
      />
      <ConfirmModal
        visible={confirm}
        icon="trash-outline"
        title={t("account.deleteTitle")}
        message={t("account.deleteMsg")}
        confirmLabel={t("account.deleteBtn")}
        onConfirm={onDelete}
        onCancel={() => setConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  who: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  note: { marginTop: 10, marginHorizontal: 4 },
  section: { marginTop: 24, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  single: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
