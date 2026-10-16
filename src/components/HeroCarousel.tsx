import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type { ThemeColors } from "../constants/colors";
import { freeLabel } from "../data/catalog";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { AppText } from "./AppText";

const AUTO_MS = 4500;
const GAP = 14;

function Separator() {
  return <View style={{ width: GAP }} />;
}

/**
 * Big swiping banner (hero series), centre card bigger, dots under it, auto-advances.
 * Performance: the list is built once (useMemo) and does NOT re-render when the active dot changes;
 * auto-advance pauses while the user drags and while Home is not on screen.
 */
export const HeroCarousel = memo(function HeroCarousel({
  items,
  onOpen,
}: {
  items: Series[];
  onOpen: (s: Series) => void;
}) {
  const colors = useTheme();
  const t = useT();
  const { width: W } = useWindowDimensions();
  const cardW = Math.round(W * 0.62);
  const cardH = Math.round((cardW * 4) / 3);
  const step = cardW + GAP;
  const side = (W - cardW) / 2;

  const scrollX = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const dragging = useRef(false);
  const focused = useRef(true);

  // Prefetch the hero covers so swiping never shows an empty card
  useEffect(() => {
    if (!items.length) return;
    const t0 = Date.now();
    Image.prefetch(
      items.map((s) => s.cover),
      "memory-disk",
    )
      .then((ok) => {
        if (__DEV__)
          console.log(
            `[home] hero ${items.length} covers prefetched=${ok} in ${Date.now() - t0}ms`,
          );
      })
      .catch(() => {});
  }, [items]);

  // Pause auto-advance when Home is not on screen (series page open, other tab…)
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, []),
  );

  // One timer for the whole life of the carousel (not re-created on every slide)
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => {
      if (dragging.current || !focused.current) return;
      const next = (indexRef.current + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * step, animated: true });
      indexRef.current = next;
      setIndex(next);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [items.length, step]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = false;
      const i = Math.max(
        0,
        Math.min(
          items.length - 1,
          Math.round(e.nativeEvent.contentOffset.x / step),
        ),
      );
      indexRef.current = i;
      setIndex(i);
    },
    [step, items.length],
  );

  const renderItem = useCallback(
    ({ item, index: i }: { item: Series; index: number }) => {
      const input = [(i - 1) * step, i * step, (i + 1) * step];
      const scale = scrollX.interpolate({
        inputRange: input,
        outputRange: [0.88, 1, 0.88],
        extrapolate: "clamp",
      });
      const opacity = scrollX.interpolate({
        inputRange: input,
        outputRange: [0.6, 1, 0.6],
        extrapolate: "clamp",
      });
      return (
        <Animated.View
          style={{ width: cardW, transform: [{ scale }], opacity }}
        >
          <HeroCard
            item={item}
            height={cardH}
            colors={colors}
            highPriority={i < 3}
            onOpen={onOpen}
          />
        </Animated.View>
      );
    },
    [cardW, cardH, step, scrollX, colors, onOpen],
  );

  // Built once per items/size/theme — changing the active dot does not touch the list
  const list = useMemo(
    () => (
      <Animated.FlatList
        ref={listRef}
        horizontal
        data={items}
        keyExtractor={(s: Series) => s.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: side }}
        ItemSeparatorComponent={Separator}
        getItemLayout={(_: unknown, i: number) => ({
          length: step,
          offset: step * i,
          index: i,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => (dragging.current = true)}
        onMomentumScrollEnd={onMomentumEnd}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    ),
    [items, renderItem, step, side, scrollX, onMomentumEnd],
  );

  if (!items.length) return null;
  const active = items[index];

  return (
    <View style={styles.root}>
      {list}

      <View style={styles.dots}>
        {items.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.dot,
              i === index
                ? { width: 18, backgroundColor: colors.primary }
                : { width: 6, backgroundColor: colors.tabInactive },
            ]}
          />
        ))}
      </View>

      {active && (
        <View style={styles.caption}>
          <AppText weight="bold" size={17} numberOfLines={1} align="center">
            {active.title}
          </AppText>
          <AppText size={12} color="textMuted" align="center">
            {freeLabel(active, t)} ·{" "}
            {t("common.episodes", { n: active.totalEpisodes })}
          </AppText>
        </View>
      )}
    </View>
  );
});

/**
 * One hero card with the tap effect: the card presses in, the play button pops and a violet ring
 * spreads out of it (+ light haptic), then the series opens.
 */
function HeroCard({
  item,
  height,
  colors,
  highPriority,
  onOpen,
}: {
  item: Series;
  height: number;
  colors: ThemeColors;
  highPriority: boolean;
  onOpen: (s: Series) => void;
}) {
  const press = useRef(new Animated.Value(1)).current; // card scale
  const pop = useRef(new Animated.Value(1)).current; // play button scale
  const ring = useRef(new Animated.Value(0)).current; // 0 → 1: ring grows + fades
  const opening = useRef(false);

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(press, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }),
      Animated.spring(pop, {
        toValue: 0.86,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }),
    ]).start();
  };
  const pressOut = () => {
    Animated.parallel([
      Animated.spring(press, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 8,
      }),
      Animated.spring(pop, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 12,
      }),
    ]).start();
  };
  const onPress = () => {
    if (opening.current) return;
    opening.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (__DEV__) console.log(`[home] hero play ${item.id}`);
    ring.setValue(0);
    Animated.sequence([
      Animated.spring(pop, {
        toValue: 1.18,
        useNativeDriver: true,
        speed: 30,
        bounciness: 10,
      }),
      Animated.spring(pop, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }),
    ]).start();
    Animated.timing(ring, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
    // open while the ring is still spreading → feels instant but you see the effect
    setTimeout(() => {
      onOpen(item);
      opening.current = false;
    }, 220);
  };

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0, 0.75, 0],
  });

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <Animated.View
        style={[
          styles.card,
          {
            height,
            borderColor: colors.glow,
            backgroundColor: colors.skeleton,
            shadowColor: colors.glow,
            transform: [{ scale: press }],
          },
        ]}
      >
        <Image
          source={{ uri: item.cover }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
          recyclingKey={item.id}
          priority={highPriority ? "high" : "normal"}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderColor: colors.glow,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.play,
            { backgroundColor: colors.overlay, transform: [{ scale: pop }] },
          ]}
        >
          <Ionicons
            name="play"
            size={28}
            color={colors.onPrimary}
            style={{ marginLeft: 4 }}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 18 },
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  play: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  dot: { height: 6, borderRadius: 3 },
  caption: { marginTop: 8, paddingHorizontal: 32, gap: 2 },
});
