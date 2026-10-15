import { memo, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import type { HomeRowDef } from "../constants/home";
import type { Series } from "../data/types";
import { useT } from "../i18n";
import { AppText } from "./AppText";
import { EmptyState } from "./EmptyState";
import { SeriesCard } from "./SeriesCard";

const CARD_WIDTH = 112;
const GAP = 12;

type Props = {
  def: HomeRowDef;
  items: Series[];
  onOpenSeries: (s: Series) => void;
  onSeeAll: (def: HomeRowDef) => void;
};

/** One Home row: title + "See all" + horizontal posters (or "No series yet"). */
export const HomeRow = memo(function HomeRow({
  def,
  items,
  onOpenSeries,
  onSeeAll,
}: Props) {
  const style = def.style ?? "default";
  const t = useT();

  const renderItem = useCallback(
    ({ item, index }: { item: Series; index: number }) => (
      <SeriesCard
        series={item}
        width={CARD_WIDTH}
        variant={style}
        rank={style === "ranked" ? index + 1 : undefined}
        onPress={onOpenSeries}
      />
    ),
    [style, onOpenSeries],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText weight="bold" size={18} numberOfLines={1} style={styles.title}>
          {t(def.title)}
        </AppText>
        {items.length > 0 && (
          <Pressable onPress={() => onSeeAll(def)} hitSlop={10}>
            <AppText weight="medium" size={13} color="textAccent">
              {t("common.seeAll")}
            </AppText>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState text={t("common.noSeries")} />
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(s) => s.id}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH + GAP,
            offset: (CARD_WIDTH + GAP) * index,
            index,
          })}
        />
      )}
    </View>
  );
});

function Separator() {
  return <View style={{ width: GAP }} />;
}

const styles = StyleSheet.create({
  root: { marginTop: 26 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  title: { flexShrink: 1 },
  list: { paddingHorizontal: 16 },
});
