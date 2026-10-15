import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { ConfirmModal } from "../../components/ConfirmModal";
import { SeriesCard } from "../../components/SeriesCard";
import { TAB_BAR_SPACE } from "../../constants/layout";
import { useCatalog } from "../../data/catalog";
import {
  historyActions,
  useContinueWatching,
  useHistory,
} from "../../data/history";
import { episodeView, progressKey, useProgress } from "../../data/progress";
import type { Series } from "../../data/types";
import { useUserState, userActions } from "../../data/userStore";
import { useTheme } from "../../hooks/useTheme";
import { canNavigate } from "../../utils/navLock";

type Tab = "saved" | "watching";
const COLUMNS = 3;
const SIDE = 16;
const GAP = 10;

/** My list tab: Saved series (grid) + Watching (continue where you stopped). Edit → select → Remove. */
export default function MyListScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { catalog } = useCatalog();
  const user = useUserState();
  const watching = useContinueWatching();
  const history = useHistory();
  const progress = useProgress();

  const [tab, setTab] = useState<Tab>("saved");
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);

  // saved series, newest saved first
  const saved = useMemo(
    () =>
      Object.entries(user.saved)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => catalog.series.find((s) => s.id === id))
        .filter((s): s is Series => !!s),
    [user.saved, catalog],
  );
  const list = tab === "saved" ? saved : watching;

  // leaving the tab ends Edit mode
  useFocusEffect(
    useCallback(() => {
      if (__DEV__) console.log("[my-list] opened");
      return () => {
        setEditing(false);
        setSelected(new Set());
      };
    }, []),
  );

  const switchTab = (t: Tab) => {
    if (t === tab) return;
    Haptics.selectionAsync().catch(() => {});
    setTab(t);
    setEditing(false);
    setSelected(new Set());
  };

  const toggle = useCallback((id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openSeries = useCallback(
    (s: Series) => {
      if (editing) {
        toggle(s.id);
        return;
      }
      if (!canNavigate(`series ${s.id}`)) return;
      if (__DEV__) console.log(`[my-list] open series ${s.id}`);
      router.push({ pathname: "/series/[id]", params: { id: s.id } });
    },
    [editing, toggle, router],
  );

  const resume = (s: Series) => {
    if (editing) {
      toggle(s.id);
      return;
    }
    if (!canNavigate(`continue ${s.id}`)) return;
    const h = history[s.id];
    if (__DEV__)
      console.log(
        `[my-list] continue ${s.id} ep ${h?.ep ?? 1} at ${h?.pos ?? 0}s`,
      );
    router.push({
      pathname: "/watch/[id]",
      params: { id: s.id, ep: String(h?.ep ?? 1), t: String(h?.pos ?? 0) },
    });
  };

  const remove = () => {
    const ids = [...selected];
    setConfirm(false);
    if (tab === "saved") userActions.unsaveMany(ids);
    else historyActions.remove(ids);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    setSelected(new Set());
    setEditing(false);
  };

  const allSelected = list.length > 0 && selected.size === list.length;
  const cardW = Math.floor((width - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <AppText weight="bold" size={26} style={{ flex: 1 }}>
          My list
        </AppText>
        {list.length > 0 && (
          <Pressable
            onPress={() => {
              setEditing((e) => !e);
              setSelected(new Set());
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.edit,
              { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <AppText
              weight="semibold"
              size={14}
              color={editing ? "textAccent" : "text"}
            >
              {editing ? "Done" : "Edit"}
            </AppText>
          </Pressable>
        )}
      </View>

      {/* Saved | Watching */}
      <View
        style={[
          styles.segment,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {(["saved", "watching"] as const).map((t) => {
          const on = t === tab;
          const n = t === "saved" ? saved.length : watching.length;
          return (
            <Pressable
              key={t}
              onPress={() => switchTab(t)}
              style={[styles.segBtn, on && { backgroundColor: colors.primary }]}
            >
              <AppText
                weight="semibold"
                size={14}
                color={on ? "onPrimary" : "textMuted"}
              >
                {t === "saved" ? "Saved" : "Watching"}
                {n ? ` · ${n}` : ""}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SIDE,
          paddingBottom: insets.bottom + TAB_BAR_SPACE + (editing ? 80 : 16),
        }}
        showsVerticalScrollIndicator={false}
      >
        {list.length === 0 ? (
          <Empty tab={tab} onDiscover={() => router.navigate("/")} />
        ) : tab === "saved" ? (
          <View style={styles.grid}>
            {saved.map((s) => (
              <View key={s.id} style={{ width: cardW }}>
                <SeriesCard series={s} width={cardW} onPress={openSeries} />
                {editing && <Check on={selected.has(s.id)} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {watching.map((s) => {
              const h = history[s.id];
              const ep = h?.ep ?? 1;
              const { watched, ratio } = episodeView(
                progress[progressKey(s.id, ep)],
              );
              const on = selected.has(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => resume(s)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: colors.surface,
                      borderColor: on ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {editing && (
                    <Ionicons
                      name={on ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={on ? colors.primary : colors.textMuted}
                    />
                  )}
                  <View
                    style={[styles.thumb, { backgroundColor: colors.skeleton }]}
                  >
                    <Image
                      source={{ uri: s.cover }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={s.id}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <AppText weight="semibold" size={15} numberOfLines={2}>
                      {s.title}
                    </AppText>
                    <AppText size={12} color="textMuted">
                      EP {ep} of {s.totalEpisodes}
                      {watched
                        ? " · watched"
                        : ratio > 0
                          ? ` · ${Math.round(ratio * 100)}%`
                          : ""}
                    </AppText>
                    <View
                      style={[styles.track, { backgroundColor: colors.border }]}
                    >
                      <View
                        style={[
                          styles.fill,
                          // whole-series progress: finished episodes + the current one
                          {
                            width: `${Math.max(2, Math.round(((ep - 1 + (watched ? 1 : ratio)) / s.totalEpisodes) * 100))}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  {!editing && (
                    <View
                      style={[styles.play, { backgroundColor: colors.primary }]}
                    >
                      <Ionicons
                        name="play"
                        size={16}
                        color={colors.onPrimary}
                        style={{ marginLeft: 2 }}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* edit bar, above the tab bar */}
      {editing && (
        <View
          style={[
            styles.editBar,
            {
              bottom: insets.bottom + TAB_BAR_SPACE,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() =>
              setSelected(
                allSelected ? new Set() : new Set(list.map((s) => s.id)),
              )
            }
            hitSlop={8}
            style={styles.selectAll}
          >
            <Ionicons
              name={allSelected ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={allSelected ? colors.primary : colors.textMuted}
            />
            <AppText weight="medium" size={14}>
              All
            </AppText>
          </Pressable>
          <Pressable
            disabled={!selected.size}
            onPress={() => setConfirm(true)}
            style={({ pressed }) => [
              styles.removeBtn,
              {
                backgroundColor: colors.danger,
                opacity: !selected.size ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.onDanger} />
            <AppText weight="semibold" size={14} color="onDanger">
              Remove{selected.size ? ` (${selected.size})` : ""}
            </AppText>
          </Pressable>
        </View>
      )}

      <ConfirmModal
        visible={confirm}
        title={
          tab === "saved"
            ? `Remove ${selected.size} from Saved?`
            : `Remove ${selected.size} from Watching?`
        }
        message={
          tab === "saved"
            ? "They will no longer be in My list. You can save them again any time."
            : "Your place in these series will be forgotten. Watched episodes stay marked."
        }
        confirmLabel="Remove"
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </View>
  );
}

function Check({ on }: { on: boolean }) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.check,
        {
          backgroundColor: on ? colors.primary : colors.overlay,
          borderColor: colors.onPrimary,
        },
      ]}
      pointerEvents="none"
    >
      {on && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
    </View>
  );
}

function Empty({ tab, onDiscover }: { tab: Tab; onDiscover: () => void }) {
  const colors = useTheme();
  return (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.primary + "22" }]}
      >
        <Ionicons
          name={tab === "saved" ? "bookmark-outline" : "play-circle-outline"}
          size={30}
          color={colors.scheme === "dark" ? colors.glow : colors.primary}
        />
      </View>
      <AppText weight="bold" size={18} align="center">
        {tab === "saved" ? "Nothing saved yet" : "Nothing watched yet"}
      </AppText>
      <AppText size={14} color="textMuted" align="center">
        {tab === "saved"
          ? "Tap the bookmark on a series to keep it here."
          : "Series you start show up here, so you can continue where you stopped."}
      </AppText>
      <Pressable
        onPress={onDiscover}
        style={({ pressed }) => [
          styles.discover,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <AppText weight="semibold" size={14} color="onPrimary">
          Discover series
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIDE,
    paddingBottom: 12,
  },
  edit: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flexDirection: "row",
    marginHorizontal: SIDE,
    marginBottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: GAP, rowGap: 16 },
  check: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
  },
  thumb: { width: 60, height: 80, borderRadius: 10, overflow: "hidden" },
  track: { height: 3, borderRadius: 2, overflow: "hidden", marginTop: 4 },
  fill: { height: 3 },
  play: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  editBar: {
    position: "absolute",
    left: SIDE,
    right: SIDE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectAll: { flexDirection: "row", alignItems: "center", gap: 6 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  discover: {
    marginTop: 10,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
