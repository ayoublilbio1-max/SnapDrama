import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";
import { freeLabel } from "../data/catalog";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";
import { AppText } from "./AppText";

const AUTO_MS = 4500;
const GAP = 14;

/** Big swiping banner (top trending series), centre card bigger, dots under it, auto-advances. */
export const HeroCarousel = memo(function HeroCarousel({
  items,
  onOpen,
}: {
  items: Series[];
  onOpen: (s: Series) => void;
}) {
  const colors = useTheme();
  const { width: W } = useWindowDimensions();
  const cardW = Math.round(W * 0.62);
  const cardH = Math.round((cardW * 4) / 3);
  const step = cardW + GAP;
  const side = (W - cardW) / 2;

  const scrollX = useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null);
  const [index, setIndex] = useState(0);
  const dragging = useRef(false);

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

  // Auto-advance (paused while the user drags)
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => {
      if (dragging.current) return;
      const next = (index + 1) % items.length;
      listRef.current?.scrollToOffset({ offset: next * step, animated: true });
      setIndex(next);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [index, items.length, step]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = false;
      const i = Math.round(e.nativeEvent.contentOffset.x / step);
      setIndex(Math.max(0, Math.min(items.length - 1, i)));
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
          <Pressable
            onPress={() => onOpen(item)}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View
              style={[
                styles.card,
                {
                  height: cardH,
                  borderColor: colors.glow,
                  backgroundColor: colors.skeleton,
                  shadowColor: colors.glow,
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
                priority={i < 3 ? "high" : "normal"}
              />
              <View style={[styles.play, { backgroundColor: colors.overlay }]}>
                <Ionicons
                  name="play"
                  size={28}
                  color={colors.onPrimary}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [cardW, cardH, step, scrollX, colors, onOpen],
  );

  if (!items.length) return null;
  const active = items[index];

  return (
    <View style={styles.root}>
      <Animated.FlatList
        ref={listRef}
        horizontal
        data={items}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: side }}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        getItemLayout={(_, i) => ({ length: step, offset: step * i, index: i })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => (dragging.current = true)}
        onMomentumScrollEnd={onMomentumEnd}
        initialNumToRender={3}
        windowSize={5}
      />

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
            {freeLabel(active)} · {active.totalEpisodes} episodes
          </AppText>
        </View>
      )}
    </View>
  );
});

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
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  dot: { height: 6, borderRadius: 3 },
  caption: { marginTop: 8, paddingHorizontal: 32, gap: 2 },
});
