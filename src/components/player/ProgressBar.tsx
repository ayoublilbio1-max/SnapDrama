import { useEventListener } from "expo";
import type { VideoPlayer } from "expo-video";
import { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import { darkColors } from "../../constants/colors";
import { withAlpha } from "../../utils/color";
import { formatTime } from "../../video/source";
import { AppText } from "../AppText";

const SIDE = 16;

/**
 * Thin progress bar at the bottom of the player; drag it to seek.
 * Subscribes to the player itself, so only this bar re-renders 4×/second (not the whole page).
 */
export function ProgressBar({
  player,
  bottom,
}: {
  player: VideoPlayer;
  bottom: number;
}) {
  const c = darkColors; // the player is always dark
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const widthRef = useRef(1);
  const durRef = useRef(0);

  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    setTime(currentTime);
    const d = player.duration;
    if (d > 0 && d !== durRef.current) {
      durRef.current = d;
      setDur(d);
    }
  });

  const pan = useMemo(() => {
    const ratioAt = (pageX: number) =>
      Math.max(0, Math.min(1, (pageX - SIDE) / widthRef.current));
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => setScrub(ratioAt(e.nativeEvent.pageX)),
      onPanResponderMove: (_, g) => setScrub(ratioAt(g.moveX)),
      onPanResponderRelease: (_, g) => {
        const r = ratioAt(g.moveX || g.x0);
        if (durRef.current > 0) {
          player.currentTime = r * durRef.current;
          if (__DEV__)
            console.log(`[player] seek → ${formatTime(r * durRef.current)}`);
        }
        setScrub(null);
      },
      onPanResponderTerminate: () => setScrub(null),
    });
  }, [player]);

  const progress = scrub ?? (dur > 0 ? time / dur : 0);

  return (
    <View style={[styles.wrap, { bottom }]} {...pan.panHandlers}>
      {scrub !== null && (
        <AppText
          weight="semibold"
          size={13}
          color="onPrimary"
          align="center"
          style={[styles.time, { textShadowColor: c.shade }]}
        >
          {formatTime(scrub * dur)} / {formatTime(dur)}
        </AppText>
      )}
      <View
        style={[
          styles.track,
          {
            backgroundColor: withAlpha(c.onPrimary, 0.25),
            height: scrub !== null ? 5 : 3,
          },
        ]}
        onLayout={(e) =>
          (widthRef.current = Math.max(1, e.nativeEvent.layout.width))
        }
      >
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: c.glow },
          ]}
        />
        {scrub !== null && (
          <View
            style={[
              styles.knob,
              { left: `${progress * 100}%`, backgroundColor: c.onPrimary },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: SIDE,
    paddingVertical: 12,
  },
  time: { marginBottom: 8, textShadowRadius: 6 },
  track: { borderRadius: 3, justifyContent: "center" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 3 },
  knob: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
});
