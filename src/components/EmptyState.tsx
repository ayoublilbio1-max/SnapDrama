import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useT } from "../i18n";
import { AppText } from "./AppText";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** "No series yet" box — used by empty Home rows, grids and search. */
export function EmptyState({
  text,
  icon = "film-outline",
  height = 120,
}: {
  text?: string;
  icon?: IconName;
  height?: number;
}) {
  const colors = useTheme();
  const t = useT();
  return (
    <View
      style={[
        styles.box,
        { height, backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={24} color={colors.textMuted} />
      <AppText size={13} color="textMuted">
        {text ?? t("common.noSeries")}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
