import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { CoinIcon } from "../../components/CoinIcon";
import { EmptyState } from "../../components/EmptyState";
import { EpisodeGrid, type EpisodeState } from "../../components/EpisodeGrid";
import { InfoModal } from "../../components/InfoModal";
import { RateSheet } from "../../components/RateSheet";
import { ScreenHeader } from "../../components/ScreenHeader";
import { freeLabel, useCatalog, useSeries } from "../../data/catalog";
import { seriesStats, useUserState, userActions } from "../../data/userStore";
import { useTheme } from "../../hooks/useTheme";
import { withAlpha } from "../../utils/color";
import { formatCount } from "../../utils/format";

const HIDDEN_TAGS = new Set(["Recommended", "New", "Hot"]); // used for Home rows, not shown as genres

type Notice = {
  title: string;
  message: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
} | null;

export default function SeriesScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { catalog } = useCatalog();
  const series = useSeries(id);
  const user = useUserState();
  const [rateOpen, setRateOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const onEpisode = useCallback(
    (n: number, state: EpisodeState) => {
      if (!series) return;
      if (__DEV__) console.log(`[series] ${series.id} tap ep ${n} (${state})`);
      Haptics.selectionAsync().catch(() => {});
      // Temporary until the player (step 2) and the unlock sheet (step 4) are built
      setNotice(
        state === "free"
          ? {
              icon: "play-circle-outline",
              title: `Episode ${n}`,
              message: "The episode player is the next step of the build.",
            }
          : {
              icon: "lock-closed-outline",
              title: `Episode ${n} is locked`,
              message: `Unlock for ${catalog.coinsPerEpisode} coins. The unlock sheet arrives with the coins step.`,
            },
      );
    },
    [series, catalog.coinsPerEpisode],
  );

  if (!series) {
    if (__DEV__) console.log(`[series] not found: ${id}`);
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader />
        <EmptyState
          text="This series is not available"
          icon="alert-circle-outline"
        />
      </View>
    );
  }

  const stats = seriesStats(series, user);
  const genres = series.tags.filter((t) => !HIDDEN_TAGS.has(t));
  const coverW = Math.round(width * 0.38);
  const coverH = Math.round((coverW * 4) / 3);
  const lockedCount = Math.max(0, series.totalEpisodes - series.freeEpisodes);

  const onSave = () => {
    const now = userActions.toggleSave(series.id);
    Haptics.impactAsync(
      now
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Light,
    ).catch(() => {});
  };

  const onShare = async () => {
    try {
      const res = await Share.share({
        message: `Watch "${series.title}" on SnapDrama 🎬 ${freeLabel(series)} — ${series.totalEpisodes} episodes`,
      });
      if (res.action === Share.sharedAction) userActions.markShared(series.id);
      else if (__DEV__) console.log(`[series] share dismissed ${series.id}`);
    } catch (e) {
      if (__DEV__) console.log("[series] share failed", String(e));
    }
  };

  const onPlay = () => {
    if (series.freeEpisodes > 0) onEpisode(1, "free");
    else
      setNotice({
        icon: "film-outline",
        title: "Trailer only",
        message:
          "Every episode of this series is locked. The trailer plays in the For you feed.",
      });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* blurred cover behind the top of the page — fades smoothly into the page colour */}
      <View
        style={[styles.backdrop, { height: coverH + insets.top + 320 }]}
        pointerEvents="none"
      >
        <Image
          source={{ uri: series.cover }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={30}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={[
            withAlpha(colors.background, 0.35),
            withAlpha(colors.background, 0.55),
            withAlpha(colors.background, 0.85),
            colors.background,
          ]}
          locations={[0, 0.45, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <ScreenHeader
        right={
          <View style={styles.headerRight}>
            <Pressable
              onPress={onShare}
              hitSlop={8}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityLabel="Share"
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={colors.text}
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* cover + main info */}
        <View style={styles.top}>
          <View
            style={[
              styles.cover,
              {
                width: coverW,
                height: coverH,
                backgroundColor: colors.skeleton,
                borderColor: colors.glow,
              },
            ]}
          >
            <Image
              source={{ uri: series.cover }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          </View>
          <View style={styles.info}>
            <AppText weight="bold" size={20} numberOfLines={3}>
              {series.title}
            </AppText>
            <Pressable
              onPress={() => setRateOpen(true)}
              style={styles.ratingRow}
              hitSlop={6}
            >
              <Ionicons name="star" size={15} color={colors.gold} />
              <AppText weight="semibold" size={14}>
                {stats.rating.toFixed(1)}
              </AppText>
              <AppText size={12} color="textMuted">
                ({formatCount(stats.ratingCount)})
              </AppText>
              <AppText weight="medium" size={12} color="textAccent">
                {stats.myStars ? `· You: ${stats.myStars}★` : "· Rate"}
              </AppText>
            </Pressable>
            <AppText size={13} color="textMuted">
              {series.totalEpisodes} episodes
            </AppText>
            <View
              style={[
                styles.freePill,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <AppText weight="semibold" size={12} color="textAccent">
                {series.freeEpisodes <= 0
                  ? "Trailer only"
                  : series.freeEpisodes === 1
                    ? "Episode 1 free"
                    : `Episodes 1–${series.freeEpisodes} free`}
              </AppText>
            </View>
          </View>
        </View>

        {/* genres */}
        {genres.length > 0 && (
          <View style={styles.tags}>
            {genres.map((t) => (
              <Pressable
                key={t}
                onPress={() =>
                  router.push({
                    pathname: "/browse",
                    params: { kind: "category", value: t, title: t },
                  })
                }
                style={[
                  styles.tag,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText size={12} weight="medium">
                  {t}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}

        {/* description */}
        {series.description ? (
          <Pressable onPress={() => setExpanded((e) => !e)}>
            <AppText
              size={14}
              numberOfLines={expanded ? undefined : 3}
              style={{ marginTop: 14 }}
            >
              {series.description}
            </AppText>
            <AppText
              weight="semibold"
              size={13}
              color="textAccent"
              style={{ marginTop: 4 }}
            >
              {expanded ? "Show less" : "More"}
            </AppText>
          </Pressable>
        ) : null}

        {/* actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={onPlay}
            style={({ pressed }) => [
              styles.play,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="play" size={20} color={colors.onPrimary} />
            <AppText weight="bold" size={16} color="onPrimary">
              {series.freeEpisodes > 0 ? "Play EP 1" : "Trailer only"}
            </AppText>
          </Pressable>
          <ActionButton
            icon={stats.isSaved ? "bookmark" : "bookmark-outline"}
            label={formatCount(stats.saveCount)}
            active={stats.isSaved}
            onPress={onSave}
          />
          <ActionButton
            icon={stats.myStars ? "star" : "star-outline"}
            label={stats.myStars ? `${stats.myStars}★` : "Rate"}
            active={!!stats.myStars}
            tint="gold"
            onPress={() => setRateOpen(true)}
          />
        </View>

        {/* episodes */}
        <View style={styles.epHeader}>
          <AppText weight="bold" size={18}>
            Episodes
          </AppText>
          {lockedCount > 0 && (
            <View style={styles.price}>
              <CoinIcon size={16} glow={false} />
              <AppText size={12} color="textMuted">
                {catalog.coinsPerEpisode} coins / locked episode
              </AppText>
            </View>
          )}
        </View>
        <EpisodeGrid
          series={series}
          coinsPerEpisode={catalog.coinsPerEpisode}
          onPress={onEpisode}
        />

        <AppText
          size={12}
          color="textMuted"
          align="center"
          style={{ marginTop: 18 }}
        >
          {formatCount(stats.shareCount)} shares ·{" "}
          {formatCount(stats.saveCount)} saves
        </AppText>
      </ScrollView>

      <RateSheet
        visible={rateOpen}
        title={series.title}
        current={stats.myStars}
        onSubmit={(s) => {
          userActions.rate(series.id, s);
          setRateOpen(false);
        }}
        onClose={() => setRateOpen(false)}
      />
      <InfoModal
        visible={!!notice}
        icon={notice?.icon}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        onClose={() => setNotice(null)}
      />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  active,
  tint = "primary",
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active: boolean;
  tint?: "primary" | "gold";
  onPress: () => void;
}) {
  const colors = useTheme();
  const on = tint === "gold" ? colors.gold : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor:
            active && tint === "gold" ? colors.goldSoft : colors.surface,
          borderColor: active ? on : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={active ? on : colors.text} />
      <AppText
        size={11}
        weight="medium"
        style={{ color: active ? on : colors.text }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  headerRight: { flex: 1, alignItems: "flex-end" },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  top: { flexDirection: "row", gap: 16, marginTop: 6 },
  cover: { borderRadius: 16, overflow: "hidden", borderWidth: 1 },
  info: { flex: 1, gap: 6, justifyContent: "flex-end" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  freePill: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  tag: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  play: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  action: {
    width: 58,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  epHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 12,
  },
  price: { flexDirection: "row", alignItems: "center", gap: 6 },
});
