import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { CoinIcon } from "../../components/CoinIcon";
import { InfoModal } from "../../components/InfoModal";
import {
  APP_NAME,
  APP_VERSION,
  DEVELOPER,
  FIVERR_URL,
} from "../../constants/app";
import { TAB_BAR_SPACE } from "../../constants/layout";
import {
  settingsActions,
  useSettings,
  type ThemePref,
} from "../../data/settings";
import { useUserState } from "../../data/userStore";
import { useVip } from "../../data/vip";
import { useBalance } from "../../data/wallet";
import { useTheme } from "../../hooks/useTheme";
import { canNavigate } from "../../utils/navLock";
import { toggleMuted, useMuted } from "../../video/mute";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Popup = "feedback" | "signin" | "language" | null;

const THEMES: { id: ThemePref; label: string; icon: IconName }[] = [
  { id: "system", label: "System", icon: "phone-portrait-outline" },
  { id: "light", label: "Light", icon: "sunny-outline" },
  { id: "dark", label: "Dark", icon: "moon-outline" },
];

/** Profile tab: who you are (demo), wallet shortcuts, settings, help & feedback, version footer. */
export default function ProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();
  const balance = useBalance();
  const vip = useVip();
  const user = useUserState();
  const muted = useMuted();
  const [popup, setPopup] = useState<Popup>(null);
  const [nameOpen, setNameOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const go = (path: "/coins" | "/vip" | "/my-list") => {
    if (!canNavigate(path)) return;
    if (__DEV__) console.log(`[profile] → ${path}`);
    if (path === "/my-list") router.navigate(path);
    else router.push(path);
  };

  const pickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (__DEV__)
        console.log(
          `[profile] avatar picker ${res.canceled ? "canceled" : "picked"}`,
        );
      if (!res.canceled && res.assets[0]?.uri)
        settingsActions.setAvatar(res.assets[0].uri);
    } catch (e) {
      if (__DEV__) console.log("[profile] avatar picker failed", String(e));
      showToast("Couldn't open your photos");
    }
  };

  const openFiverr = () => {
    setPopup(null);
    if (__DEV__) console.log("[profile] open Fiverr");
    Linking.openURL(FIVERR_URL).catch((e) => {
      if (__DEV__) console.log("[profile] could not open Fiverr", String(e));
      showToast("Couldn't open the link");
    });
  };

  const clearCache = async () => {
    const t0 = Date.now();
    try {
      await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
      if (__DEV__)
        console.log(`[profile] image cache cleared in ${Date.now() - t0}ms`);
      showToast("Image cache cleared");
    } catch (e) {
      if (__DEV__) console.log("[profile] clear cache failed", String(e));
      showToast("Couldn't clear the cache");
    }
  };

  const deviceInfo = `${APP_NAME} ${APP_VERSION} · Android API ${Platform.Version}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + TAB_BAR_SPACE + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* who */}
        <View style={styles.who}>
          <Pressable
            onPress={pickAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: vip ? colors.gold : colors.glow,
                },
              ]}
            >
              {settings.avatar ? (
                <Image
                  source={{ uri: settings.avatar }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={34} color={colors.textAccent} />
              )}
            </View>
            <View
              style={[
                styles.camera,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
              ]}
            >
              <Ionicons name="camera" size={12} color={colors.onPrimary} />
            </View>
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Pressable
              onPress={() => setNameOpen(true)}
              style={styles.nameRow}
              hitSlop={6}
            >
              <AppText
                weight="bold"
                size={20}
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {settings.name}
              </AppText>
              <Ionicons
                name="create-outline"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            <AppText size={12} color="textMuted">
              ID {settings.userId}
            </AppText>
            {vip ? (
              <View
                style={[styles.vipBadge, { backgroundColor: colors.goldSoft }]}
              >
                <Ionicons name="diamond" size={11} color={colors.gold} />
                <AppText weight="bold" size={11} style={{ color: colors.gold }}>
                  VIP
                </AppText>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => setPopup("signin")}
            style={({ pressed }) => [
              styles.signIn,
              { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <AppText weight="semibold" size={13} color="textAccent">
              Sign in
            </AppText>
          </Pressable>
        </View>

        {/* stats */}
        <View style={styles.stats}>
          <Stat label="Coins" onPress={() => go("/coins")}>
            <View style={styles.statValue}>
              <CoinIcon size={18} glow={false} />
              <AppText weight="bold" size={18}>
                {balance}
              </AppText>
            </View>
          </Stat>
          <Stat label="VIP" onPress={() => go("/vip")}>
            <AppText
              weight="bold"
              size={18}
              style={{ color: vip ? colors.gold : colors.text }}
            >
              {vip ? "Active" : "Get"}
            </AppText>
          </Stat>
          <Stat label="Saved" onPress={() => go("/my-list")}>
            <AppText weight="bold" size={18}>
              {Object.keys(user.saved).length}
            </AppText>
          </Stat>
        </View>

        {/* wallet */}
        <Section title="Wallet">
          <Row
            icon="wallet-outline"
            label="Coin shop"
            hint="Coin packs & history"
            onPress={() => go("/coins")}
          />
          <Row
            icon="diamond-outline"
            label="VIP"
            hint={vip ? "Active" : "Unlock every episode free"}
            onPress={() => go("/vip")}
            last
          />
        </Section>

        {/* settings */}
        <Section title="Settings">
          <View
            style={[
              styles.row,
              {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
                flexDirection: "column",
                alignItems: "stretch",
                gap: 10,
              },
            ]}
          >
            <View style={styles.rowTop}>
              <RowIcon icon="contrast-outline" />
              <AppText weight="medium" size={15} style={{ flex: 1 }}>
                Theme
              </AppText>
            </View>
            <View
              style={[styles.themes, { backgroundColor: colors.surfaceAlt }]}
            >
              {THEMES.map((t) => {
                const on = settings.theme === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      settingsActions.setTheme(t.id);
                    }}
                    style={[
                      styles.themeBtn,
                      on && { backgroundColor: colors.primary },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Ionicons
                      name={t.icon}
                      size={15}
                      color={on ? colors.onPrimary : colors.textMuted}
                    />
                    <AppText
                      weight="semibold"
                      size={13}
                      color={on ? "onPrimary" : "textMuted"}
                    >
                      {t.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View
            style={[
              styles.row,
              {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <RowIcon
              icon={muted ? "volume-mute-outline" : "volume-high-outline"}
            />
            <View style={{ flex: 1 }}>
              <AppText weight="medium" size={15}>
                Sound
              </AppText>
              <AppText size={12} color="textMuted">
                {muted ? "Videos start muted" : "Videos play with sound"}
              </AppText>
            </View>
            <Switch
              value={!muted}
              onValueChange={() => toggleMuted()}
              trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
              thumbColor={colors.onPrimary}
            />
          </View>
          <Row
            icon="language-outline"
            label="Language"
            hint="English"
            onPress={() => setPopup("language")}
          />
          <Row
            icon="trash-bin-outline"
            label="Clear image cache"
            hint="Frees space, covers load again"
            onPress={clearCache}
            last
          />
        </Section>

        {/* help */}
        <Section title="Help">
          <Row
            icon="chatbubble-ellipses-outline"
            label="Feedback"
            hint="Report a bug or tell us what to improve"
            onPress={() => setPopup("feedback")}
          />
          <Row
            icon="briefcase-outline"
            label="Contact the developer"
            hint={`Fiverr · ${DEVELOPER}`}
            onPress={openFiverr}
            last
          />
        </Section>

        {/* footer */}
        <View style={styles.footer}>
          <AppText size={12} color="textMuted">
            {APP_NAME} {APP_VERSION}
          </AppText>
          <AppText size={12} color="textMuted">
            Developed with{" "}
            <AppText size={12} style={{ color: colors.danger }}>
              ♥
            </AppText>{" "}
            by {DEVELOPER}
          </AppText>
        </View>
      </ScrollView>

      {toast ? (
        <View
          style={[
            styles.toast,
            {
              bottom: insets.bottom + TAB_BAR_SPACE + 8,
              backgroundColor: colors.text,
            },
          ]}
          pointerEvents="none"
        >
          <AppText
            weight="medium"
            size={13}
            style={{ color: colors.background }}
          >
            {toast}
          </AppText>
        </View>
      ) : null}

      <InfoModal
        visible={popup === "feedback"}
        icon="chatbubble-ellipses-outline"
        title="Send feedback"
        message={`Found a bug or have an idea to make ${APP_NAME} better? Contact me on Fiverr (${DEVELOPER}) and tell me what happened.`}
        actionLabel="Open my Fiverr profile"
        onAction={openFiverr}
        onClose={() => setPopup(null)}
      >
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceAlt }]}>
          <AppText size={12} color="textMuted">
            Please add this to your message:
          </AppText>
          <AppText weight="semibold" size={13} selectable>
            {deviceInfo}
          </AppText>
        </View>
      </InfoModal>
      <InfoModal
        visible={popup === "signin"}
        icon="person-circle-outline"
        title="Not in the demo"
        message="Accounts and sync across devices are part of the full app. In this demo everything is saved on this phone."
        actionLabel="Contact the developer"
        onAction={openFiverr}
        onClose={() => setPopup(null)}
      />
      <InfoModal
        visible={popup === "language"}
        icon="language-outline"
        title="Not in the demo"
        message="More app languages are part of the full app. This demo is in English."
        actionLabel="Contact the developer"
        onAction={openFiverr}
        onClose={() => setPopup(null)}
      />
      <NameSheet
        visible={nameOpen}
        current={settings.name}
        onClose={() => setNameOpen(false)}
      />
    </View>
  );
}

function Stat({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.stat,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {children}
      <AppText size={12} color="textMuted">
        {label}
      </AppText>
    </Pressable>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <AppText
        weight="bold"
        size={14}
        color="textMuted"
        style={{ marginBottom: 8, marginLeft: 4 }}
      >
        {title}
      </AppText>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function RowIcon({ icon }: { icon: IconName }) {
  const colors = useTheme();
  return (
    <View style={[styles.rowIcon, { backgroundColor: colors.surfaceAlt }]}>
      <Ionicons name={icon} size={18} color={colors.textAccent} />
    </View>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <RowIcon icon={icon} />
      <View style={{ flex: 1 }}>
        <AppText weight="medium" size={15}>
          {label}
        </AppText>
        {hint ? (
          <AppText size={12} color="textMuted" numberOfLines={1}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

/** Small dialog to change the display name (saved on the phone). Sits high, so the keyboard never covers it. */
function NameSheet({
  visible,
  current,
  onClose,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(current);

  useEffect(() => {
    if (visible) setValue(current);
  }, [visible, current]);

  const save = () => {
    settingsActions.setName(value);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    onClose();
  };

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
        style={[
          styles.backdrop,
          { backgroundColor: colors.overlay, paddingTop: insets.top + 90 },
        ]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText weight="bold" size={18}>
            Your name
          </AppText>
          <TextInput
            value={value}
            onChangeText={setValue}
            maxLength={24}
            autoFocus
            placeholder="Guest"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={save}
            selectionColor={colors.primary}
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={save}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <AppText weight="semibold" size={15} color="onPrimary">
              Save
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  vipBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 1,
    marginTop: 2,
  },
  signIn: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stats: { flexDirection: "row", gap: 10, marginTop: 20 },
  stat: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    gap: 2,
  },
  statValue: { flexDirection: "row", alignItems: "center", gap: 5 },
  card: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  themes: { flexDirection: "row", borderRadius: 14, padding: 3 },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 34,
    borderRadius: 11,
  },
  footer: { alignItems: "center", gap: 2, marginTop: 26 },
  toast: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoBox: {
    alignSelf: "stretch",
    borderRadius: 12,
    padding: 10,
    gap: 2,
    marginBottom: 8,
  },
  backdrop: { flex: 1, justifyContent: "flex-start", paddingHorizontal: 24 },
  sheet: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: "BricolageGrotesque-Medium",
    fontSize: 16,
  },
  saveBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
