import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { CoinIcon } from "../../components/CoinIcon";
import { InfoModal } from "../../components/InfoModal";
import { RateSheet } from "../../components/RateSheet";
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
  type LangPref,
  type ThemePref,
} from "../../data/settings";
import { useUserState } from "../../data/userStore";
import { useVip } from "../../data/vip";
import { useBalance } from "../../data/wallet";
import { useTheme } from "../../hooks/useTheme";
import { LANGS, deviceLang, useT, type Key } from "../../i18n";
import { cancelAllNotifications, ensurePermission } from "../../notifications";
import { canNavigate } from "../../utils/navLock";
import { setMuted } from "../../video/mute";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const THEMES: { id: ThemePref; label: Key; icon: IconName }[] = [
  {
    id: "system",
    label: "profile.themeSystem",
    icon: "phone-portrait-outline",
  },
  { id: "light", label: "profile.themeLight", icon: "sunny-outline" },
  { id: "dark", label: "profile.themeDark", icon: "moon-outline" },
];

/** Profile tab: who you are (demo), wallet, account, settings, help & about, version footer. */
export default function ProfileScreen() {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = useSettings();
  const balance = useBalance();
  const vip = useVip();
  const user = useUserState();
  const [feedback, setFeedback] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
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

  const go = (path: Href, tab = false) => {
    if (!canNavigate(String(path))) return;
    if (__DEV__) console.log(`[profile] → ${String(path)}`);
    if (tab) router.navigate(path);
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
      showToast(t("profile.photosError"));
    }
  };

  const openFiverr = () => {
    setFeedback(false);
    if (__DEV__) console.log("[profile] open Fiverr");
    Linking.openURL(FIVERR_URL).catch((e) => {
      if (__DEV__) console.log("[profile] could not open Fiverr", String(e));
      showToast(t("profile.linkError"));
    });
  };

  const clearCache = async () => {
    const t0 = Date.now();
    try {
      await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
      if (__DEV__)
        console.log(`[profile] image cache cleared in ${Date.now() - t0}ms`);
      showToast(t("profile.cacheCleared"));
    } catch (e) {
      if (__DEV__) console.log("[profile] clear cache failed", String(e));
      showToast(t("profile.cacheError"));
    }
  };

  const onStartMuted = (on: boolean) => {
    settingsActions.setStartMuted(on);
    setMuted(on, "settings"); // takes effect right away too
  };

  const onNotifications = async (on: boolean) => {
    if (!on) {
      settingsActions.setNotifications(false);
      await cancelAllNotifications();
      return;
    }
    const allowed = await ensurePermission(true);
    if (!allowed) {
      showToast(t("profile.notifDenied"));
      Linking.openSettings().catch(() => {});
      return;
    }
    settingsActions.setNotifications(true); // NotificationsGate plans them again
    showToast(t("profile.notifOn"));
  };

  const shareApp = async () => {
    try {
      await Share.share({ message: t("share.app", { app: APP_NAME }) });
    } catch (e) {
      if (__DEV__) console.log("[profile] share app failed", String(e));
    }
  };

  const name = settings.name === "Guest" ? t("profile.guest") : settings.name;
  const langLabel =
    settings.language === "system"
      ? `${t("profile.langSystem")} · ${LANGS.find((l) => l.id === deviceLang())?.label}`
      : (LANGS.find((l) => l.id === settings.language)?.label ?? "");
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
            accessibilityLabel={t("profile.changePhoto")}
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
                {name}
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
            onPress={() => go("/account")}
            style={({ pressed }) => [
              styles.signIn,
              { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <AppText weight="semibold" size={13} color="textAccent">
              {t("profile.signIn")}
            </AppText>
          </Pressable>
        </View>

        {/* stats */}
        <View style={styles.stats}>
          <Stat label={t("coins.title")} onPress={() => go("/coins")}>
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
              {vip ? t("profile.vipActive") : t("profile.vipGet")}
            </AppText>
          </Stat>
          <Stat label={t("mylist.saved")} onPress={() => go("/my-list", true)}>
            <AppText weight="bold" size={18}>
              {Object.keys(user.saved).length}
            </AppText>
          </Stat>
        </View>

        {/* wallet */}
        <Section title={t("profile.wallet")}>
          <Row
            icon="wallet-outline"
            label={t("profile.coinShop")}
            hint={t("profile.coinShopHint")}
            onPress={() => go("/coins")}
          />
          <Row
            icon="diamond-outline"
            label="VIP"
            hint={vip ? t("profile.vipActive") : t("profile.vipHint")}
            onPress={() => go("/vip")}
            last
          />
        </Section>

        {/* account */}
        <Section title={t("account.title")}>
          <Row
            icon="person-circle-outline"
            label={t("profile.manageAccount")}
            hint={t("profile.manageAccountHint")}
            onPress={() => go("/account")}
            last
          />
        </Section>

        {/* settings */}
        <Section title={t("profile.settings")}>
          <View
            style={[
              styles.row,
              styles.column,
              {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.rowTop}>
              <RowIcon icon="contrast-outline" />
              <AppText weight="medium" size={15} style={{ flex: 1 }}>
                {t("profile.theme")}
              </AppText>
            </View>
            <View
              style={[styles.themes, { backgroundColor: colors.surfaceAlt }]}
            >
              {THEMES.map((th) => {
                const on = settings.theme === th.id;
                return (
                  <Pressable
                    key={th.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      settingsActions.setTheme(th.id);
                    }}
                    style={[
                      styles.themeBtn,
                      on && { backgroundColor: colors.primary },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Ionicons
                      name={th.icon}
                      size={15}
                      color={on ? colors.onPrimary : colors.textMuted}
                    />
                    <AppText
                      weight="semibold"
                      size={13}
                      color={on ? "onPrimary" : "textMuted"}
                      numberOfLines={1}
                    >
                      {t(th.label)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Row
            icon="language-outline"
            label={t("profile.language")}
            hint={langLabel}
            onPress={() => setLangOpen(true)}
          />
          <SwitchRow
            icon="volume-mute-outline"
            label={t("profile.startMuted")}
            hint={
              settings.startMuted
                ? t("profile.startMutedOn")
                : t("profile.startMutedOff")
            }
            value={settings.startMuted}
            onChange={onStartMuted}
          />
          <SwitchRow
            icon="notifications-outline"
            label={t("profile.notifications")}
            hint={
              settings.notifications
                ? t("profile.notificationsOn")
                : t("profile.notificationsOff")
            }
            value={settings.notifications}
            onChange={onNotifications}
          />
          <Row
            icon="trash-bin-outline"
            label={t("profile.clearCache")}
            hint={t("profile.clearCacheHint")}
            onPress={clearCache}
            last
          />
        </Section>

        {/* help & about */}
        <Section title={t("profile.help")}>
          <Row
            icon="chatbubble-ellipses-outline"
            label={t("profile.feedback")}
            hint={t("profile.feedbackHint")}
            onPress={() => setFeedback(true)}
          />
          <Row
            icon={settings.myStars ? "star" : "star-outline"}
            label={t("profile.rateUs")}
            hint={
              settings.myStars
                ? t("profile.rated", { n: settings.myStars })
                : t("profile.rateUsHint", { app: APP_NAME })
            }
            onPress={() => setRateOpen(true)}
          />
          <Row
            icon="share-social-outline"
            label={t("profile.shareApp", { app: APP_NAME })}
            hint={t("profile.shareAppHint")}
            onPress={shareApp}
          />
          <Row
            icon="help-circle-outline"
            label={t("info.faq")}
            onPress={() => go("/info/faq")}
          />
          <Row
            icon="shield-checkmark-outline"
            label={t("info.privacy")}
            onPress={() => go("/info/privacy")}
          />
          <Row
            icon="document-text-outline"
            label={t("info.terms")}
            onPress={() => go("/info/terms")}
          />
          <Row
            icon="briefcase-outline"
            label={t("common.contactDev")}
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
            {t("profile.madeWith")}{" "}
            <AppText size={12} style={{ color: colors.danger }}>
              ♥
            </AppText>{" "}
            {t("profile.by")} {DEVELOPER}
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
        visible={feedback}
        icon="chatbubble-ellipses-outline"
        title={t("feedback.title")}
        message={t("feedback.message", { app: APP_NAME, dev: DEVELOPER })}
        actionLabel={t("feedback.open")}
        onAction={openFiverr}
        onClose={() => setFeedback(false)}
      >
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceAlt }]}>
          <AppText size={12} color="textMuted">
            {t("feedback.addThis")}
          </AppText>
          <AppText weight="semibold" size={13} selectable>
            {deviceInfo}
          </AppText>
        </View>
      </InfoModal>
      <RateSheet
        visible={rateOpen}
        title={APP_NAME}
        heading={t("rateApp.title", { app: APP_NAME })}
        current={settings.myStars}
        onSubmit={(stars) => {
          settingsActions.setMyStars(stars);
          setRateOpen(false);
          showToast(stars >= 4 ? t("rateApp.thanksHigh") : t("rateApp.thanks"));
        }}
        onClose={() => setRateOpen(false)}
      />
      <LanguageSheet
        visible={langOpen}
        current={settings.language}
        onClose={() => setLangOpen(false)}
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

function SwitchRow({
  icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <RowIcon icon={icon} />
      <View style={{ flex: 1 }}>
        <AppText weight="medium" size={15}>
          {label}
        </AppText>
        <AppText size={12} color="textMuted">
          {hint}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
        thumbColor={colors.onPrimary}
      />
    </View>
  );
}

/** Settings › Language: follow the phone, or English / Français / Español / Deutsch. Changes the whole app at once. */
function LanguageSheet({
  visible,
  current,
  onClose,
}: {
  visible: boolean;
  current: LangPref;
  onClose: () => void;
}) {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const options: { id: LangPref; label: string; flag: string }[] = [
    {
      id: "system",
      label: `${t("profile.langSystem")} · ${LANGS.find((l) => l.id === deviceLang())?.label}`,
      flag: "📱",
    },
    ...LANGS,
  ];
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
        style={[styles.sheetBackdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.bottomSheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText weight="bold" size={18} style={{ marginBottom: 6 }}>
            {t("profile.language")}
          </AppText>
          {options.map((o) => {
            const on = o.id === current;
            return (
              <Pressable
                key={o.id}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  settingsActions.setLanguage(o.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.langRow,
                  {
                    backgroundColor: on ? colors.primary + "22" : "transparent",
                    borderColor: on ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <AppText size={20}>{o.flag}</AppText>
                <AppText
                  weight={on ? "semibold" : "medium"}
                  size={15}
                  style={{ flex: 1 }}
                >
                  {o.label}
                </AppText>
                {on && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
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
  const t = useT();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(current);

  useEffect(() => {
    if (visible) setValue(current === "Guest" ? "" : current);
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
            styles.dialog,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <AppText weight="bold" size={18}>
            {t("profile.yourName")}
          </AppText>
          <TextInput
            value={value}
            onChangeText={setValue}
            maxLength={24}
            autoFocus
            placeholder={t("profile.guest")}
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
              {t("profile.save")}
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
  column: { flexDirection: "column", alignItems: "stretch", gap: 10 },
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
    paddingHorizontal: 4,
  },
  footer: { alignItems: "center", gap: 2, marginTop: 26 },
  toast: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: "86%",
  },
  infoBox: {
    alignSelf: "stretch",
    borderRadius: 12,
    padding: 10,
    gap: 2,
    marginBottom: 8,
  },
  backdrop: { flex: 1, justifyContent: "flex-start", paddingHorizontal: 24 },
  dialog: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  sheetBackdrop: { flex: 1, justifyContent: "flex-end" },
  bottomSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
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
