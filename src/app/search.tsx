import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { AppText, FONT } from "../components/AppText";
import { ScreenHeader } from "../components/ScreenHeader";
import { SeriesGrid } from "../components/SeriesGrid";
import { getTrending, useCatalog } from "../data/catalog";
import type { Series } from "../data/types";
import { useTheme } from "../hooks/useTheme";

/** Search by title or tag. Empty search → trending series. */
export default function SearchScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { catalog } = useCatalog();
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const items = useMemo(() => {
    if (!query) return getTrending(catalog);
    return catalog.series.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.tags.some((t) => t.toLowerCase().includes(query)),
    );
  }, [catalog, query]);

  const open = useCallback(
    (s: Series) => {
      if (__DEV__) console.log(`[search] "${query}" → open ${s.id}`);
      router.push({ pathname: "/series/[id]", params: { id: s.id } });
    },
    [router, query],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        right={
          <View
            style={[
              styles.box,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              autoFocus
              placeholder="Search series"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              style={[
                styles.input,
                { color: colors.text, fontFamily: FONT.regular },
              ]}
            />
            {q.length > 0 && (
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
                onPress={() => setQ("")}
              />
            )}
          </View>
        }
      />
      <SeriesGrid
        items={items}
        onOpen={open}
        emptyText={`No series for "${q.trim()}"`}
        header={
          <AppText weight="bold" size={16} style={styles.heading}>
            {query
              ? `${items.length} result${items.length === 1 ? "" : "s"}`
              : "Popular now"}
          </AppText>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  heading: { marginBottom: 12 },
});
