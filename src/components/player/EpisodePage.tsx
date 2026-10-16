import Ionicons from "@expo/vector-icons/Ionicons";
import { useEvent, useEventListener } from "expo";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { darkColors } from "../../constants/colors";
import { useDownloadUri } from "../../data/downloads";
import type { Episode, Series, VideoSource } from "../../data/types";
import {
  episodeLikes,
  seriesStats,
  userActions,
  useUserState,
} from "../../data/userStore";
import { useT } from "../../i18n";
import { withAlpha } from "../../utils/color";
import { formatCount } from "../../utils/format";
import { registerFeedControl } from "../../video/feedControl";
import { isMuted, useMuted } from "../../video/mute";
import {
  BUNNY_TIMEOUT_MS,
  getEpisodeSource,
  markBunnyFailed,
} from "../../video/source";
import { getSpeed, useSpeed } from "../../video/speed";
import { AppText } from "../AppText";
import { PlayerMenu } from "./PlayerMenu";
import { ProgressBar } from "./ProgressBar";

export type PlayerItem =
  | {
      key: string;
      kind: "episode";
      n: number;
      video: VideoSource;
      likeCount: number;
      title: string;
    }
  | {
      key: string;
      kind: "trailer";
      n: 0;
      video: VideoSource;
      likeCount: number;
      title: string;
    }
  | { key: string; kind: "locked"; n: number };

type PlayableItem = Exclude<PlayerItem, { kind: "locked" }>;

type Props = {
  item: PlayableItem;
  series: Series;
  height: number;
  bottomInset: number;
  active: boolean; // this page is on screen → plays
  nearby: boolean; // active ± 1 → has a player (preloaded), others = poster only (max 3 players)
  startAt: number; // seconds (resume)
  onEnded: (n: number) => void;
  onProgress: (n: number, time: number, duration: number) => void;
  onEpisodes: () => void;
  onShare: () => void;
  clean: boolean; // "Clear" mode: hide texts + buttons, only the video
  onToggleClean: () => void;
  onSubtitles: () => void;
  /** 'feed' = For you tab: loops, no Episodes button, "Watch series" button, rank pill */
  variant?: "player" | "feed";
  rank?: number;
  onWatchSeries?: () => void;
  onOpenSeries?: () => void;
};

/** One full-screen page of the vertical player. */
export const EpisodePage = memo(function EpisodePage(props: Props) {
  const { item, height, nearby } = props;
  const c = darkColors;
  return (
    <View style={{ height, backgroundColor: c.background }}>
      {nearby ? (
        <PlayerSurface {...props} />
      ) : (
        <Poster uri={item.video.thumbUrl ?? props.series.cover} />
      )}
    </View>
  );
});

function Poster({ uri }: { uri: string }) {
  return (
    <Image
      source={{ uri }}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  );
}

function PlayerSurface({
  item,
  series,
  height,
  bottomInset,
  active,
  startAt,
  onEnded,
  onProgress,
  onEpisodes,
  onShare,
  clean,
  onToggleClean,
  onSubtitles,
  variant = "player",
  rank,
  onWatchSeries,
  onOpenSeries,
}: Props) {
  const isFeed = variant === "feed";
  const c = darkColors;
  const t = useT();
  const tag = `${series.id} ${item.kind === "trailer" ? "trailer" : `ep ${item.n}`}`;

  // ── source choice: Bunny first, R2 on error / timeout ──
  const [forceR2, setForceR2] = useState(false);
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localUri = useDownloadUri(series.id, item.n); // downloaded → plays from the phone (offline)
  const choice = useMemo(
    () => getEpisodeSource(item.video, forceR2, localUri),
    [item.video, forceR2, retry, localUri],
  );
  const source = useMemo(
    () =>
      choice ? { uri: choice.uri, useCaching: choice.kind !== "local" } : null,
    [choice],
  );
  const resumeAt = useRef(startAt);
  const lastTime = useRef(startAt);
  const t0 = useRef(Date.now());
  const readyLogged = useRef(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  const player = useVideoPlayer(source, (p) => {
    p.loop = variant === "feed"; // the feed replays the video until you swipe (TikTok style)
    p.muted = isMuted();
    p.timeUpdateEventInterval = 0.25;
    if (resumeAt.current > 0) p.currentTime = resumeAt.current;
  });

  // one sound switch for all videos (🔊 button in the top bar, see MuteButton.tsx)
  const muted = useMuted();
  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  const { status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });

  const [firstFrame, setFirstFrame] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [fast, setFast] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const speed = useSpeed();
  useEffect(() => {
    if (!fast) player.playbackRate = speed;
  }, [player, speed, fast]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(id);
  }, [toast]);
  const episode: Episode | null =
    item.kind === "episode"
      ? {
          ...item.video,
          n: item.n,
          title: item.title,
          likeCount: item.likeCount,
        }
      : null;

  // new source → measure again, show the poster until the first frame
  useEffect(() => {
    t0.current = Date.now();
    readyLogged.current = false;
    setFirstFrame(false);
    setFailed(false);
  }, [choice]);

  const switchToR2 = (why: string) => {
    if (!choice || choice.kind !== "bunny" || !item.video.mp4Url) return false;
    markBunnyFailed(why);
    resumeAt.current = lastTime.current;
    if (__DEV__)
      console.log(
        `[video] ${tag} → bunny failed (${why}) → r2 from ${Math.round(lastTime.current)}s`,
      );
    setForceR2(true);
    return true;
  };

  // status: ready / error
  useEffect(() => {
    if (!choice) return;
    if (status === "readyToPlay") {
      // only the FIRST ready of this source (seek / buffering make it 'ready' again later)
      if (__DEV__ && !readyLogged.current)
        console.log(
          `[video] ${tag} → ${choice.kind} ok in ${Date.now() - t0.current}ms`,
        );
      readyLogged.current = true;
    } else if (status === "error") {
      if (!switchToR2("error")) {
        setFailed(true);
        if (__DEV__)
          console.log(
            `[video] ${tag} → ${choice.kind} failed, no fallback → Retry screen`,
          );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, choice]);

  // Bunny too slow (only for the episode on screen) → R2
  useEffect(() => {
    if (!active || !choice || choice.kind !== "bunny" || !item.video.mp4Url)
      return;
    if (player.status === "readyToPlay") return;
    const t = setTimeout(() => {
      if (player.status !== "readyToPlay")
        switchToR2(`timeout ${BUNNY_TIMEOUT_MS / 1000}s`);
    }, BUNNY_TIMEOUT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, choice, player]);

  // play only the page on screen; reset pause/speed when the page changes
  useEffect(() => {
    if (active) {
      setUserPaused(false);
      player.play();
    } else {
      player.pause();
      player.playbackRate = getSpeed();
      setFast(false);
    }
  }, [active, player]);

  // feed only: pause/resume straight away when the tab is left/entered (see feedControl.ts)
  const userPausedRef = useRef(false);
  userPausedRef.current = userPaused;
  useEffect(() => {
    if (!isFeed) return;
    return registerFeedControl({
      pause: () => player.pause(),
      resume: () => {
        if (activeRef.current && !userPausedRef.current) player.play();
      },
    });
  }, [isFeed, player]);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    lastTime.current = currentTime;
    if (currentTime > 0.05) setFirstFrame(true);
    if (activeRef.current) onProgress(item.n, currentTime, player.duration);
  });

  useEventListener(player, "playToEnd", () => {
    if (__DEV__) console.log(`[player] ${tag} ended`);
    if (activeRef.current) onEnded(item.n);
  });

  // ── gestures: tap = play/pause · double-tap = like · long-press = 2× ──
  const user = useUserState();
  const likes = episodeLikes(series.id, item.n, item.likeCount, user);
  const stats = seriesStats(series, user);
  const lastTap = useRef(0);
  const singleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heart = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({
    opacity: heart.value,
    transform: [{ scale: 0.6 + heart.value * 0.6 }],
  }));

  useEffect(
    () => () => {
      if (singleTimer.current) clearTimeout(singleTimer.current);
    },
    [],
  );

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setUserPaused(true);
      if (__DEV__)
        console.log(
          `[player] ${tag} pause at ${Math.round(lastTime.current)}s`,
        );
    } else {
      player.play();
      setUserPaused(false);
    }
  };

  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 260) {
      if (singleTimer.current) clearTimeout(singleTimer.current);
      lastTap.current = 0;
      userActions.like(series.id, item.n);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      heart.value = withSequence(
        withTiming(1, { duration: 140 }),
        withDelay(320, withTiming(0, { duration: 220 })),
      );
      return;
    }
    lastTap.current = now;
    singleTimer.current = setTimeout(togglePlay, 260);
  };

  const onLongPress = () => {
    player.playbackRate = 2;
    setFast(true);
    Haptics.selectionAsync().catch(() => {});
    if (__DEV__) console.log(`[player] ${tag} 2× speed`);
  };

  const onPressOut = () => {
    if (!fast) return;
    player.playbackRate = getSpeed(); // back to the chosen speed (menu ⋯)
    setFast(false);
  };

  const label =
    item.kind === "trailer" ? t("free.trailer") : t("player.ep", { n: item.n });
  const showPoster = !firstFrame || !source;

  return (
    <View style={StyleSheet.absoluteFill}>
      {source && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
        />
      )}
      {showPoster && <Poster uri={item.video.thumbUrl ?? series.cover} />}

      {/* tap / double-tap / long-press area */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onTap}
        onLongPress={onLongPress}
        onPressOut={onPressOut}
        delayLongPress={350}
      />

      {/* bottom gradient so texts and buttons are always readable */}
      {!clean && (
        <LinearGradient
          colors={[
            withAlpha(c.background, 0),
            withAlpha(c.background, 0.55),
            withAlpha(c.background, 0.9),
          ]}
          locations={[0, 0.55, 1]}
          style={[styles.gradient, { height: height * 0.4 }]}
          pointerEvents="none"
        />
      )}

      {/* centre: loading / paused / heart / 2× */}
      <View style={styles.center} pointerEvents="none">
        {active &&
          !failed &&
          (status === "loading" || (!firstFrame && status !== "error")) && (
            <Spinner />
          )}
        {active && userPaused && !isPlaying && firstFrame && (
          <View style={[styles.bigIcon, { backgroundColor: c.overlay }]}>
            <Ionicons
              name="play"
              size={38}
              color={c.onPrimary}
              style={{ marginLeft: 5 }}
            />
          </View>
        )}
        <Animated.View style={[styles.heart, heartStyle]}>
          <Ionicons name="heart" size={96} color={c.danger} />
        </Animated.View>
      </View>
      {fast && (
        <View
          style={[styles.fastBadge, { backgroundColor: c.overlay }]}
          pointerEvents="none"
        >
          <Ionicons name="play-forward" size={14} color={c.onPrimary} />
          <AppText weight="bold" size={13} color="onPrimary">
            {t("player.fast")}
          </AppText>
        </View>
      )}

      {/* failed → Retry */}
      {failed && (
        <View style={[styles.failed, { backgroundColor: c.overlay }]}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={c.textMuted}
          />
          <AppText weight="bold" size={17} color="onPrimary">
            {t("player.unavailable")}
          </AppText>
          <Pressable
            onPress={() => {
              if (__DEV__) console.log(`[video] ${tag} retry`);
              setForceR2(false);
              setRetry((r) => r + 1);
            }}
            style={[styles.retry, { backgroundColor: c.primary }]}
          >
            <AppText weight="semibold" size={14} color="onPrimary">
              {t("common.retry")}
            </AppText>
          </Pressable>
        </View>
      )}

      {/* clear mode: one small button to bring everything back */}
      {clean && (
        <Pressable
          onPress={onToggleClean}
          hitSlop={10}
          style={[
            styles.showUi,
            { bottom: bottomInset + 40, backgroundColor: c.overlay },
          ]}
          accessibilityLabel={t("player.showButtons")}
        >
          <Ionicons name="eye-outline" size={20} color={c.onPrimary} />
        </Pressable>
      )}

      {/* right side buttons */}
      {!clean && (
        <View style={[styles.side, { bottom: bottomInset + 120 }]}>
          <SideButton
            icon={likes.isLiked ? "heart" : "heart-outline"}
            color={likes.isLiked ? c.danger : c.onPrimary}
            label={formatCount(likes.count)}
            onPress={() => {
              const now = userActions.toggleLike(series.id, item.n);
              if (now)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                  () => {},
                );
            }}
          />
          <SideButton
            icon={stats.isSaved ? "bookmark" : "bookmark-outline"}
            color={stats.isSaved ? c.glow : c.onPrimary}
            label={formatCount(stats.saveCount)}
            onPress={() => userActions.toggleSave(series.id)}
          />
          {!isFeed && (
            <SideButton
              icon="albums-outline"
              color={c.onPrimary}
              label={t("series.episodes")}
              onPress={onEpisodes}
            />
          )}
          <SideButton
            icon="arrow-redo-outline"
            color={c.onPrimary}
            label={formatCount(stats.shareCount)}
            onPress={onShare}
          />
          <SideButton
            icon="ellipsis-horizontal-circle-outline"
            color={c.onPrimary}
            label={speed !== 1 ? `${speed}×` : t("menu.more")}
            onPress={() => setMenuOpen(true)}
          />
        </View>
      )}

      {/* bottom-left texts */}
      {!clean && (
        <View
          style={[styles.info, { bottom: bottomInset + 44 }]}
          pointerEvents="box-none"
        >
          {isFeed && rank ? (
            <View style={[styles.rankPill, { backgroundColor: c.overlay }]}>
              <Ionicons name="flame" size={12} color={c.gold} />
              <AppText weight="bold" size={11} style={{ color: c.gold }}>
                {t("player.rank", { n: rank })}
              </AppText>
            </View>
          ) : null}
          <Pressable
            onPress={onOpenSeries}
            disabled={!onOpenSeries}
            hitSlop={6}
          >
            <AppText
              weight="bold"
              size={17}
              color="onPrimary"
              numberOfLines={1}
              style={{ textShadowColor: c.shade, textShadowRadius: 6 }}
            >
              {series.title}
              {onOpenSeries ? " ›" : ""}
            </AppText>
          </Pressable>
          <View style={styles.epRow}>
            <View style={[styles.epPill, { backgroundColor: c.primary }]}>
              <AppText weight="bold" size={11} color="onPrimary">
                {label}
              </AppText>
            </View>
            <AppText size={13} style={{ color: c.textMuted }}>
              {item.kind === "trailer"
                ? t("common.episodes", { n: series.totalEpisodes })
                : t("player.of", { n: series.totalEpisodes })}
            </AppText>
          </View>
          {series.description ? (
            <AppText
              size={13}
              numberOfLines={2}
              style={{ color: withAlpha(c.onPrimary, 0.85) }}
            >
              {series.description}
            </AppText>
          ) : null}
          {isFeed && onWatchSeries ? (
            <Pressable
              onPress={onWatchSeries}
              style={({ pressed }) => [
                styles.watchBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <LinearGradient
                colors={c.gradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="play" size={16} color={c.onPrimary} />
              <AppText weight="bold" size={14} color="onPrimary">
                {t("player.watchSeries")}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      )}

      {source && <ProgressBar player={player} bottom={bottomInset + 4} />}

      {toast ? (
        <View
          style={[styles.toast, { backgroundColor: c.overlay }]}
          pointerEvents="none"
        >
          <AppText weight="medium" size={13} color="onPrimary">
            {toast}
          </AppText>
        </View>
      ) : null}

      <PlayerMenu
        visible={menuOpen}
        series={series}
        episode={episode}
        showAutoUnlock={!isFeed}
        onSubtitles={onSubtitles}
        onClear={onToggleClean}
        onToast={setToast}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

/** Small rotating ring while the video loads. */
function Spinner() {
  const c = darkColors;
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
  }, [r]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${r.value}deg` }],
  }));
  return (
    <Animated.View
      style={[
        styles.spinnerRing,
        { borderColor: withAlpha(c.onPrimary, 0.25), borderTopColor: c.glow },
        style,
      ]}
    />
  );
}

function SideButton({
  icon,
  color,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  label: string;
  onPress: () => void;
}) {
  const c = darkColors;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.sideBtn, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons
        name={icon}
        size={30}
        color={color}
        style={{ textShadowColor: c.shade, textShadowRadius: 6 }}
      />
      <AppText
        weight="semibold"
        size={12}
        color="onPrimary"
        style={{ textShadowColor: c.shade, textShadowRadius: 4 }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: { position: "absolute", left: 0, right: 0, bottom: 0 },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
  },
  bigIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: { position: "absolute" },
  fastBadge: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  failed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  retry: {
    marginTop: 6,
    paddingHorizontal: 26,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  side: { position: "absolute", right: 10, alignItems: "center", gap: 14 },
  showUi: {
    position: "absolute",
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toast: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sideBtn: { alignItems: "center", gap: 2, minWidth: 56 },
  info: { position: "absolute", left: 16, right: 90, gap: 6 },
  epRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  epPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1 },
  rankPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  watchBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
