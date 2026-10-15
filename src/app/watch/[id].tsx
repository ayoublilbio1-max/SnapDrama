import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { DemoEpisodeModal } from "../../components/DemoEpisodeModal";
import type { EpisodeState } from "../../components/EpisodeGrid";
import { InfoModal } from "../../components/InfoModal";
import {
  EpisodePage,
  type PlayerItem,
} from "../../components/player/EpisodePage";
import { EpisodesSheet } from "../../components/player/EpisodesSheet";
import { LockedCard } from "../../components/player/LockedCard";
import { MuteButton } from "../../components/player/MuteButton";
import { UnlockSheet } from "../../components/UnlockSheet";
import { FIVERR_URL } from "../../constants/app";
import { darkColors } from "../../constants/colors";
import {
  freeLabel,
  isEpisodeFree,
  useCatalog,
  useSeries,
} from "../../data/catalog";
import { historyActions } from "../../data/history";
import { progressActions } from "../../data/progress";
import { rewardsActions } from "../../data/rewards";
import type { Series } from "../../data/types";
import { userActions } from "../../data/userStore";
import { isUnlocked, useUnlocked } from "../../data/wallet";
import { hasVideo } from "../../video/source";

const SAVE_EVERY_MS = 5000;

/**
 * Pages of the player, top to bottom:
 * trailer (if the series has one) → free (or unlocked) episodes with a video → one locked card.
 * An unlocked episode joins the pages only if it has a video (brief §8 rule).
 */
function buildItems(
  series: Series,
  unlocked: Record<string, number>,
): PlayerItem[] {
  const items: PlayerItem[] = [];
  if (series.trailer && hasVideo(series.trailer)) {
    // a trailer has no likes of its own → it shows the series' count
    items.push({
      key: "trailer",
      kind: "trailer",
      n: 0,
      video: series.trailer,
      likeCount: series.saveCount,
      title: "Trailer",
    });
  }
  series.episodes
    .filter(
      (e) =>
        (isEpisodeFree(series, e.n) || isUnlocked(unlocked, series.id, e.n)) &&
        hasVideo(e),
    )
    .sort((a, b) => a.n - b.n)
    .forEach((e) =>
      items.push({
        key: `ep${e.n}`,
        kind: "episode",
        n: e.n,
        video: e,
        likeCount: e.likeCount,
        title: e.title,
      }),
    );
  const lastFree = items.reduce((m, it) => Math.max(m, it.n), 0);
  if (series.totalEpisodes > lastFree)
    items.push({ key: `lock${lastFree + 1}`, kind: "locked", n: lastFree + 1 });
  return items;
}

/**
 * Vertical episode player (brief §8): one page per episode, one page per swipe, auto-next,
 * only 3 players alive (current ± 1, the next one is preloaded), always dark.
 * Route: /watch/<seriesId>?ep=3&t=42   (ep=0 = trailer)
 */
export default function WatchScreen() {
  const c = darkColors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    ep?: string;
    t?: string;
  }>();
  const { catalog } = useCatalog();
  const series = useSeries(params.id);

  const unlocked = useUnlocked();
  const items = useMemo(
    () => (series ? buildItems(series, unlocked) : []),
    [series, unlocked],
  );
  const startIndex = useMemo(() => {
    const ep = params.ep === undefined ? NaN : Number(params.ep);
    const i = items.findIndex((it) => it.n === ep && it.kind !== "locked");
    if (i >= 0) return i;
    const firstEp = items.findIndex((it) => it.kind === "episode"); // default: EP 1, not the trailer
    return firstEp >= 0 ? firstEp : 0;
  }, [items, params.ep]);
  const startAt = Number(params.t ?? 0) || 0;

  const [active, setActive] = useState(startIndex);
  const [pageH, setPageH] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [clean, setClean] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false); // subtitles: not in the demo
  const [unlockN, setUnlockN] = useState(0); // episode in the Unlock sheet (0 = closed)
  const [noVideo, setNoVideo] = useState(false); // "This is a demo" popup
  const listRef = useRef<FlatList<PlayerItem>>(null);
  const lastSave = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (__DEV__ && series) {
      const eps = items.filter((i) => i.kind === "episode").length;
      console.log(
        `[player] open ${series.id} — ${items.some((i) => i.kind === "trailer") ? "trailer + " : ""}${eps} free eps` +
          `${items.some((i) => i.kind === "locked") ? " + locked card" : ""}, start ${items[startIndex]?.key ?? "-"} at ${startAt}s`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series?.id]);

  // always-dark screen: light status bar while here
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("auto");
    }, []),
  );

  // history: save when the episode changes (trailer is not saved), then every 5 s (quietly)
  const activeItem = items[active];
  useEffect(() => {
    if (series && activeItem?.kind === "episode") {
      historyActions.save(
        series.id,
        activeItem.n,
        active === startIndex ? startAt : 0,
      );
      rewardsActions.episodeWatched(series.id, activeItem.n); // Rewards: "Watch N episodes"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, series?.id]);

  // ── stable callbacks (they don't change on every page change → pages don't all re-render) ──
  const onProgress = useCallback(
    (n: number, time: number, duration: number) => {
      if (!series || n <= 0) return;
      progressActions.update(series.id, n, time, duration); // quiet, cheap
      const now = Date.now();
      if (now - lastSave.current < SAVE_EVERY_MS) return;
      lastSave.current = now;
      historyActions.save(series.id, n, time);
    },
    [series],
  );

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      listRef.current?.scrollToIndex({ index, animated: true });
      setActive(index);
    },
    [items.length],
  );

  const onEnded = useCallback(
    (n: number) => {
      if (series && n > 0) progressActions.markDone(series.id, n);
      const next = activeRef.current + 1;
      if (__DEV__)
        console.log(`[player] auto-next → ${items[next]?.key ?? "end"}`);
      goTo(next);
    },
    [goTo, items, series],
  );

  // player closes → save progress now so the series page shows the latest bars
  useEffect(() => () => progressActions.flush(), []);

  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const v = viewableItems.find((x) => x.isViewable);
      if (v?.index != null && v.index !== activeRef.current) setActive(v.index);
    },
  ).current;

  // brief §8: an episode plays only if it has a video; unlocked without video → "This is a demo"
  const playUnlocked = useCallback(
    (n: number) => {
      const i = items.findIndex((it) => it.kind === "episode" && it.n === n);
      if (i >= 0) {
        goTo(i);
        return;
      }
      if (__DEV__)
        console.log(`[paywall] demo: no video for ${series?.id} ep ${n}`);
      setNoVideo(true);
    },
    [items, goTo, series?.id],
  );

  const openUnlock = useCallback(
    (n: number) => {
      if (__DEV__) console.log(`[player] unlock tap ep ${n}`);
      if (series && isUnlocked(unlocked, series.id, n)) playUnlocked(n);
      else setUnlockN(n);
    },
    [series, unlocked, playUnlocked],
  );

  const onShare = useCallback(async () => {
    if (!series) return;
    try {
      const res = await Share.share({
        message: `Watch "${series.title}" on SnapDrama 🎬 ${freeLabel(series)}`,
      });
      if (res.action === Share.sharedAction) userActions.markShared(series.id);
    } catch (e) {
      if (__DEV__) console.log("[player] share failed", String(e));
    }
  }, [series]);

  // brief §7: features not in the demo open a themed "not in the demo" popup
  const onSubtitles = useCallback(() => {
    if (__DEV__) console.log("[player] subtitles → not in the demo");
    setDemoOpen(true);
  }, []);

  const openSheet = useCallback(() => {
    progressActions.flush(); // the sheet shows up-to-date bars
    setSheet(true);
  }, []);
  const toggleClean = useCallback(() => {
    setClean((v) => {
      if (__DEV__) console.log(`[player] clear mode ${!v ? "on" : "off"}`);
      return !v;
    });
  }, []);

  const onPick = useCallback(
    (n: number, state: EpisodeState) => {
      setSheet(false);
      if (state === "locked" || state === "unlocked") {
        setTimeout(() => openUnlock(n), 250); // let the Episodes sheet slide away first
        return;
      }
      const i = items.findIndex((it) => it.kind === "episode" && it.n === n);
      if (__DEV__) console.log(`[player] pick ep ${n} → page ${i}`);
      if (i >= 0) goTo(i);
    },
    [items, goTo, openUnlock],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: PlayerItem; index: number }) => {
      if (!series) return null;
      if (item.kind === "locked") {
        return (
          <LockedCard
            series={series}
            n={item.n}
            price={catalog.coinsPerEpisode}
            height={pageH}
            unlocked={isUnlocked(unlocked, series.id, item.n)}
            onUnlock={() => openUnlock(item.n)}
            onPlay={() => playUnlocked(item.n)}
            onEpisodes={openSheet}
          />
        );
      }
      return (
        <EpisodePage
          item={item}
          series={series}
          height={pageH}
          bottomInset={insets.bottom}
          active={index === active}
          nearby={Math.abs(index - active) <= 1}
          startAt={index === startIndex ? startAt : 0}
          onEnded={onEnded}
          onProgress={onProgress}
          onEpisodes={openSheet}
          onShare={onShare}
          clean={clean}
          onToggleClean={toggleClean}
          onSubtitles={onSubtitles}
        />
      );
    },
    [
      series,
      pageH,
      insets.bottom,
      active,
      startIndex,
      startAt,
      onEnded,
      onProgress,
      openSheet,
      onShare,
      clean,
      toggleClean,
      onSubtitles,
      catalog.coinsPerEpisode,
      unlocked,
      openUnlock,
      playUnlocked,
    ],
  );

  if (!series || !items.length) {
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: c.background,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <AppText color="onPrimary">This series can't be played.</AppText>
      </View>
    );
  }

  const currentEp =
    activeItem && activeItem.kind === "episode" ? activeItem.n : 0;

  return (
    <View
      style={[styles.root, { backgroundColor: c.background }]}
      onLayout={(e) => setPageH(Math.round(e.nativeEvent.layout.height))}
    >
      {pageH > 0 && (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(it) => it.key}
          renderItem={renderItem}
          extraData={`${active}-${clean}`}
          // exactly ONE page per swipe, even on a fast fling (no skipping episodes)
          snapToInterval={pageH}
          snapToAlignment="start"
          disableIntervalMomentum
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, i) => ({
            length: pageH,
            offset: pageH * i,
            index: i,
          })}
          initialScrollIndex={startIndex}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        />
      )}

      {/* top bar (hidden in Clear mode) */}
      {!clean && (
        <View
          style={[styles.top, { paddingTop: insets.top + 6 }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            hitSlop={10}
            style={[styles.back, { backgroundColor: c.overlay }]}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={c.onPrimary} />
          </Pressable>
          <AppText
            weight="semibold"
            size={15}
            color="onPrimary"
            numberOfLines={1}
            style={[styles.topTitle, { textShadowColor: c.shade }]}
          >
            {series.title}
          </AppText>
          <MuteButton />
        </View>
      )}

      <EpisodesSheet
        visible={sheet}
        series={series}
        current={currentEp}
        coinsPerEpisode={catalog.coinsPerEpisode}
        onPick={onPick}
        onClose={() => setSheet(false)}
      />
      <InfoModal
        visible={demoOpen}
        icon="language-outline"
        title="Not in the demo"
        message="Subtitles in 50+ languages are part of the full app. This demo plays episodes without subtitles."
        actionLabel="Contact the developer"
        onAction={() => {
          setDemoOpen(false);
          if (__DEV__) console.log("[player] demo → open Fiverr");
          Linking.openURL(FIVERR_URL).catch((e) => {
            if (__DEV__)
              console.log("[player] could not open Fiverr", String(e));
          });
        }}
        onClose={() => setDemoOpen(false)}
      />
      <UnlockSheet
        visible={unlockN > 0}
        series={series}
        n={unlockN}
        price={catalog.coinsPerEpisode}
        onClose={() => setUnlockN(0)}
        onPlay={(n) => {
          setUnlockN(0);
          setTimeout(() => playUnlocked(n), 250); // let the sheet slide away first
        }}
        onGetCoins={() => {
          setUnlockN(0);
          router.push("/coins");
        }}
        onGetVip={() => {
          setUnlockN(0);
          router.push("/vip");
        }}
      />
      <DemoEpisodeModal visible={noVideo} onClose={() => setNoVideo(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { flex: 1, textShadowRadius: 6 },
});
