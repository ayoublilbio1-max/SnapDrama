import Ionicons from "@expo/vector-icons/Ionicons";
import {
    StyleSheet,
    TextInput,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import { FONT } from "./AppText";

/** Rounded search input (Search page + "search in this page" on list pages). */
export function SearchField({
  value,
  onChange,
  placeholder = "Search series",
  autoFocus = false,
  style,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useTheme();
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.input, { color: colors.text, fontFamily: FONT.regular }]}
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={colors.textMuted}
          onPress={() => onChange("")}
          accessibilityLabel="Clear search"
        />
      )}
    </View>
  );
}

/** Same matching rule everywhere: title or any tag contains the text. */
export function matchesQuery(
  s: { title: string; tags: string[] },
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    s.title.toLowerCase().includes(q) ||
    s.tags.some((t) => t.toLowerCase().includes(q))
  );
}

const styles = StyleSheet.create({
  box: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
});
