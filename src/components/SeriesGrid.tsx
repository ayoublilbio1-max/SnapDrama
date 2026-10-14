import { FlashList } from "@shopify/flash-list";
import { useCallback, type ReactElement } from "react";
import { View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Series } from "../data/types";
import { EmptyState } from "./EmptyState";
import { SeriesCard } from "./SeriesCard";

const COLUMNS = 3;
const SIDE = 16;
const GAP = 10;

/** 3-column poster grid (See all, filters, categories, search). FlashList = fast with many items. */
export function SeriesGrid({
  items,
  onOpen,
  header,
  emptyText,
}: {
  items: Series[];
  onOpen: (s: Series) => void;
  header?: ReactElement;
  emptyText?: string;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardW = Math.floor((width - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const renderItem = useCallback(
    ({ item, index }: { item: Series; index: number }) => (
      <View
        style={{
          flex: 1,
          marginBottom: 16,
          // first column left, middle centred, last right → equal gaps between cards
          alignItems:
            index % COLUMNS === 0
              ? "flex-start"
              : index % COLUMNS === COLUMNS - 1
                ? "flex-end"
                : "center",
        }}
      >
        <SeriesCard series={item} width={cardW} onPress={onOpen} />
      </View>
    ),
    [cardW, onOpen],
  );

  return (
    <FlashList
      data={items}
      numColumns={COLUMNS}
      keyExtractor={(s) => s.id}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState text={emptyText} height={160} />}
      contentContainerStyle={{
        paddingHorizontal: SIDE,
        paddingBottom: insets.bottom + 32,
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}
