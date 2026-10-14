import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

/** One pulsing grey block. */
export function Skeleton({
  width,
  height,
  radius = 12,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useTheme();
  const o = useSharedValue(0.5);

  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [o]);

  const pulse = useAnimatedStyle(() => ({ opacity: o.value }));

  return (
    <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton }, pulse, style]} />
  );
}

/** Home while the catalog is loading: header, chips, hero card, two rows. */
export function HomeSkeleton() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        <Skeleton width={32} height={32} radius={10} />
        <Skeleton width={120} height={20} radius={8} />
        <View style={{ flex: 1 }} />
        <Skeleton width={74} height={34} radius={17} />
        <Skeleton width={38} height={38} radius={19} />
      </View>
      <View style={[styles.row, { marginTop: 18 }]}>
        {[80, 60, 56, 104, 70].map((w, i) => (
          <Skeleton key={i} width={w} height={36} radius={18} />
        ))}
      </View>
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <Skeleton width="62%" height={300} radius={22} />
      </View>
      {[0, 1].map((r) => (
        <View key={r} style={{ marginTop: 26 }}>
          <Skeleton width={150} height={20} radius={8} style={{ marginHorizontal: 16 }} />
          <View style={[styles.row, { marginTop: 12 }]}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} width={112} height={150} radius={14} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, overflow: 'hidden' },
});
