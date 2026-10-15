import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { darkColors } from "../constants/colors";
import { useT } from "../i18n";

export type Rect = { x: number; y: number; width: number; height: number };

const OPEN_MS = 260;
const CLOSE_MS = 220;
const SWIPE_CLOSE = 120;

/**
 * Full-screen cover viewer: the cover grows out of its place on the page (smooth, 60 fps on the UI thread).
 * Tap or swipe down = close · pinch = zoom (up to 4×) · drag when zoomed = move.
 */
export function CoverViewer({
  visible,
  uri,
  from,
  onClose,
}: {
  visible: boolean;
  uri: string;
  from: Rect | null;
  onClose: () => void;
}) {
  const c = darkColors;
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();

  // final size: 3:4 cover, as big as fits the screen
  let tw = W;
  let th = (tw * 4) / 3;
  const maxH = H - insets.top - insets.bottom - 40;
  if (th > maxH) {
    th = maxH;
    tw = (th * 3) / 4;
  }
  const tx = (W - tw) / 2;
  const ty = (H - th) / 2;
  const start = from ?? { x: tx, y: ty, width: tw, height: th };

  const progress = useSharedValue(0); // 0 = on the page, 1 = full screen
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 1;
      savedScale.value = 1;
      transX.value = 0;
      transY.value = 0;
      progress.value = 0;
      progress.value = withTiming(1, { duration: OPEN_MS });
      if (__DEV__) console.log("[series] cover viewer open");
    }
  }, [visible, progress, scale, savedScale, transX, transY]);

  const close = () => {
    scale.value = withTiming(1, { duration: CLOSE_MS });
    transX.value = withTiming(0, { duration: CLOSE_MS });
    transY.value = withTiming(0, { duration: CLOSE_MS });
    progress.value = withTiming(0, { duration: CLOSE_MS });
    setTimeout(onClose, CLOSE_MS + 10);
  };

  // gestures run on the JS thread (simple + safe), the animation itself stays on the UI thread
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onUpdate((e) => {
      scale.value = Math.max(0.8, Math.min(4, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1) scale.value = withSpring(1);
      savedScale.value = Math.max(1, scale.value);
      if (savedScale.value === 1) {
        transX.value = withSpring(0);
        transY.value = withSpring(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        transX.value = savedX.value + e.translationX;
        transY.value = savedY.value + e.translationY;
      } else {
        transY.value = e.translationY; // not zoomed: drag down to close
      }
    })
    .onEnd((e) => {
      if (savedScale.value > 1) {
        savedX.value = transX.value;
        savedY.value = transY.value;
        return;
      }
      if (Math.abs(e.translationY) > SWIPE_CLOSE) close();
      else transY.value = withSpring(0);
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd(() => {
      if (savedScale.value <= 1) close();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => {
      const zoomIn = savedScale.value <= 1;
      scale.value = withTiming(zoomIn ? 2.2 : 1, { duration: 200 });
      savedScale.value = zoomIn ? 2.2 : 1;
      if (!zoomIn) {
        transX.value = withTiming(0);
        transY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, tap),
  );

  const imageStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [start.x, tx]),
    top: interpolate(progress.value, [0, 1], [start.y, ty]),
    width: interpolate(progress.value, [0, 1], [start.width, tw]),
    height: interpolate(progress.value, [0, 1], [start.height, th]),
    borderRadius: interpolate(progress.value, [0, 1], [16, 12]),
    transform: [
      { translateX: transX.value },
      { translateY: transY.value },
      { scale: scale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity:
      progress.value *
      (1 -
        Math.min(1, Math.abs(transY.value) / 400) * (scale.value > 1 ? 0 : 1)),
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: c.background },
            backdropStyle,
          ]}
        />
        <GestureDetector gesture={gesture}>
          <Animated.View style={StyleSheet.absoluteFill}>
            <Animated.View style={[styles.image, imageStyle]}>
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
        <Animated.View
          style={[styles.close, { top: insets.top + 10 }, backdropStyle]}
        >
          <Pressable
            onPress={close}
            hitSlop={10}
            style={[styles.closeBtn, { backgroundColor: c.overlay }]}
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={22} color={c.onPrimary} />
          </Pressable>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  image: { position: "absolute", overflow: "hidden" },
  close: { position: "absolute", right: 16 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
