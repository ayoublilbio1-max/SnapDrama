import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Switch,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    downloadActions,
    downloadKey,
    formatSize,
    useDownloads,
} from "../../data/downloads";
import { settingsActions, useSettings } from "../../data/settings";
import type { Episode, Series } from "../../data/types";
import { useTheme } from "../../hooks/useTheme";
import { useT } from "../../i18n";
import { SPEEDS, setSpeed, useSpeed } from "../../video/speed";
import { AppText } from "../AppText";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * Player "⋯" menu (like ReelShort / ShortMax): playback speed, download this episode,
 * auto-unlock, subtitles, clear mode.
 */
export function PlayerMenu({
  visible,
  series,
  episode,
  showAutoUnlock,
  onSubtitles,
  onClear,
  onToast,
  onClose,
}: {
  visible: boolean;
  series: Series;
  episode: Episode | null; // null = trailer (no download)
  showAutoUnlock: boolean;
  onSubtitles: () => void;
  onClear: () => void;
  onToast: (text: string) => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const speed = useSpeed();
  const { items, busy } = useDownloads();
  const { autoUnlock } = useSettings();

  const k = episode ? downloadKey(series.id, episode.n) : "";
  const saved = episode ? items[k] : undefined;
  const loading = episode ? !!busy[k] : false;
  const canDownload = !!episode?.mp4Url;

  const onDownload = async () => {
    if (!episode || saved || loading) return;
    Haptics.selectionAsync().catch(() => {});
    onToast(t("dl.started", { n: episode.n }));
    const ok = await downloadActions.download(series, episode);
    onToast(ok ? t("dl.done", { n: episode.n }) : t("dl.failed"));
  };

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
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* speed */}
          <AppText weight="bold" size={15} style={styles.label}>
            {t("menu.speed")}
          </AppText>
          <View style={[styles.speeds, { backgroundColor: colors.surfaceAlt }]}>
            {SPEEDS.map((s) => {
              const on = s === speed;
              return (
                <Pressable
                  key={s}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSpeed(s);
                  }}
                  style={[
                    styles.speedBtn,
                    on && { backgroundColor: colors.primary },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <AppText
                    weight="semibold"
                    size={14}
                    color={on ? "onPrimary" : "textMuted"}
                  >
                    {s}×
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* download */}
          {episode ? (
            <Row
              icon={saved ? "checkmark-circle" : "download-outline"}
              label={
                saved
                  ? t("dl.saved", { n: episode.n })
                  : t("dl.episode", { n: episode.n })
              }
              hint={
                saved
                  ? `${formatSize(saved.size)} · ${t("dl.offlineHint")}`
                  : canDownload
                    ? t("dl.hint")
                    : t("dl.unavailable")
              }
              disabled={!canDownload || !!saved || loading}
              right={
                loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : undefined
              }
              onPress={onDownload}
            />
          ) : null}

          {/* auto-unlock */}
          {showAutoUnlock ? (
            <View style={[styles.row, { borderTopColor: colors.border }]}>
              <View
                style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}
              >
                <Ionicons
                  name="lock-open-outline"
                  size={18}
                  color={colors.textAccent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="medium" size={15}>
                  {t("auto.title")}
                </AppText>
                <AppText size={12} color="textMuted">
                  {t("auto.short")}
                </AppText>
              </View>
              <Switch
                value={autoUnlock}
                onValueChange={(v) => settingsActions.setAutoUnlock(v)}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            </View>
          ) : null}

          <Row
            icon="language-outline"
            label={t("player.subtitles")}
            hint={t("menu.subtitlesHint")}
            onPress={() => {
              onClose();
              onSubtitles();
            }}
          />
          <Row
            icon="eye-off-outline"
            label={t("menu.clear")}
            hint={t("menu.clearHint")}
            onPress={() => {
              onClose();
              onClear();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  icon,
  label,
  hint,
  disabled,
  right,
  onPress,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  disabled?: boolean;
  right?: React.ReactNode;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={colors.textAccent} />
      </View>
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
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  label: { marginBottom: 8 },
  speeds: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 3,
    marginBottom: 8,
  },
  speedBtn: {
    flex: 1,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
