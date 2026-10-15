import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Share,
  StyleSheet,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { InfoModal } from "../../components/InfoModal";
import { EpisodePage } from "../../components/player/EpisodePage";
import { MuteButton } from "../../components/player/MuteButton";
import { Skeleton } from "../../components/Skeleton";
import { FIVERR_URL } from "../../constants/app";
import { darkColors } from "../../constants/colors";
import { TAB_BAR_SPACE } from "../../constants/layout";
import { freeLabel, useCatalog } from "../../data/catalog";
import { getFeedItems, type FeedItem } from "../../data/feed";
import { useHistory } from "../../data/history";
import { userActions } from "../../data/userStore";
import { useT } from "../../i18n";
import { canNavigate } from "../../utils/navLock";
import { pauseFeed, resumeFeed } from "../../video/feedControl";

const noop = () => {};

/**
 * For you — vertical feed of the trending series (brief §8).
 * One series per swipe, the next one preloaded (3 players max), each video loops,
 * plays only while this tab is on screen. The video area is always dark.
 */
export default function ForYouScreen() {
  const c = darkColors;
  const t = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { catalog, status } = useCatalog();
  const history = useHistory();
  const historyRef = useRef(history);
  historyRef.current = history;

  const items = useMemo(() => getFeedItems(catalog), [catalog]);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [pageH, setPageH] = useState(0);
  const [clean, setClean] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const activeRef = useRef(0);
  activeRef.current = active;

  // play only while the tab is on screen; light status bar over the dark video
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      resumeFeed();
      setStatusBarStyle("light");
      if (__DEV__) console.log(`[feed] focused at item ${activeRef.current}`);
      return () => {
        pauseFeed(); // immediately — this screen may be frozen right after
        setFocused(false);
        setStatusBarStyle("auto");
        if (__DEV__) console.log("[feed] left → paused");
      };
    }, []),
  );

  const onViewable = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const v = viewableItems.find((x) => x.isViewable);
      if (v?.index != null && v.index !== activeRef.current) {
        setActive(v.index);
        if (__DEV__) console.log(`[feed] → ${(v.item as FeedItem)?.key}`);
      }
    },
  ).current;

  const watchSeries = useCallback(
    (f: FeedItem) => {
      if (!canNavigate(`watch series ${f.series.id}`)) return;
      const h = historyRef.current[f.series.id];
      const ep = h?.ep ?? 1;
      const pos = h?.pos ?? 0;
      if (__DEV__)
        console.log(`[feed] watch series ${f.series.id} → ep ${ep} at ${pos}s`);
      if (f.series.freeEpisodes <= 0) {
        router.push({ pathname: "/series/[id]", params: { id: f.series.id } });
        return;
      }
      router.push({
        pathname: "/watch/[id]",
        params: { id: f.series.id, ep: String(ep), t: String(pos) },
      });
    },
    [router],
  );

  const openSeries = useCallback(
    (f: FeedItem) =>
      canNavigate(`series ${f.series.id}`) &&
      router.push({ pathname: "/series/[id]", params: { id: f.series.id } }),
    [router],
  );

  const share = useCallback(
    async (f: FeedItem) => {
      try {
        const res = await Share.share({
          message: t("share.series", {
            title: f.series.title,
            free: freeLabel(f.series, t),
          }),
        });
        if (res.action === Share.sharedAction)
          userActions.markShared(f.series.id);
      } catch (e) {
        if (__DEV__) console.log("[feed] share failed", String(e));
      }
    },
    [t],
  );

  const toggleClean = useCallback(() => setClean((v) => !v), []);
  const onSubtitles = useCallback(() => setDemoOpen(true), []);

  const bottomInset = insets.bottom + TAB_BAR_SPACE - 8; // texts + bar sit above the floating tab bar

  const renderItem = useCallback(
    ({ item: f, index }: { item: FeedItem; index: number }) => (
      <EpisodePage
        item={f.item}
        series={f.series}
        height={pageH}
        bottomInset={bottomInset}
        active={focused && index === active}
        nearby={Math.abs(index - active) <= 1}
        startAt={0}
        onEnded={noop}
        onProgress={noop}
        onEpisodes={noop}
        onShare={() => share(f)}
        clean={clean}
        onToggleClean={toggleClean}
        onSubtitles={onSubtitles}
        variant="feed"
        rank={f.rank}
        onWatchSeries={() => watchSeries(f)}
        onOpenSeries={() => openSeries(f)}
      />
    ),
    [
      pageH,
      bottomInset,
      focused,
      active,
      clean,
      toggleClean,
      onSubtitles,
      share,
      watchSeries,
      openSeries,
    ],
  );

  return (
    <View
      style={[styles.root, { backgroundColor: c.background }]}
      onLayout={(e) => setPageH(Math.round(e.nativeEvent.layout.height))}
    >
      {status === "loading" || pageH === 0 ? (
        <View
          style={[
            styles.root,
            { padding: 16, paddingTop: insets.top + 60, gap: 12 },
          ]}
        >
          <Skeleton width="100%" height="70%" radius={20} />
          <Skeleton width="60%" height={18} radius={8} />
          <Skeleton width="40%" height={14} radius={8} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(f) => f.key}
          renderItem={renderItem}
          extraData={`${active}-${focused}-${clean}`}
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
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        />
      )}

      {!clean && (
        <View
          style={[styles.top, { paddingTop: insets.top + 6 }]}
          pointerEvents="box-none"
        >
          <View style={styles.side} />
          <AppText
            weight="bold"
            size={18}
            color="onPrimary"
            style={{ textShadowColor: c.shade, textShadowRadius: 6 }}
          >
            {t("tabs.forYou")}
          </AppText>
          <View style={[styles.side, { alignItems: "flex-end" }]}>
            <MuteButton />
          </View>
        </View>
      )}

      <InfoModal
        visible={demoOpen}
        icon="language-outline"
        title={t("demo.notInDemo")}
        message={t("demo.subtitles")}
        actionLabel={t("common.contactDev")}
        onAction={() => {
          setDemoOpen(false);
          Linking.openURL(FIVERR_URL).catch(() => {});
        }}
        onClose={() => setDemoOpen(false)}
      />
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
    paddingHorizontal: 12,
  },
  side: { flex: 1 },
});
