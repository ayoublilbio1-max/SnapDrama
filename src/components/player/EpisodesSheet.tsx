import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Series } from "../../data/types";
import { useTheme } from "../../hooks/useTheme";
import { AppText } from "../AppText";
import { EpisodeGrid, type EpisodeState } from "../EpisodeGrid";

/** Bottom sheet with the episodes grid, opened from the player. */
export function EpisodesSheet({
  visible,
  series,
  current,
  coinsPerEpisode,
  onPick,
  onClose,
}: {
  visible: boolean;
  series: Series;
  current: number;
  coinsPerEpisode: number;
  onPick: (n: number, state: EpisodeState) => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxHeight: height * 0.7,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText weight="bold" size={18} numberOfLines={1}>
            {series.title}
          </AppText>
          <AppText size={13} color="textMuted" style={{ marginBottom: 14 }}>
            {current > 0 ? `Watching EP ${current} · ` : ""}
            {series.totalEpisodes} episodes
          </AppText>
          <ScrollView showsVerticalScrollIndicator={false}>
            <EpisodeGrid
              series={series}
              coinsPerEpisode={coinsPerEpisode}
              onPress={onPick}
              current={current}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
});
