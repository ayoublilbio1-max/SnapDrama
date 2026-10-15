import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { ScreenHeader } from "../../components/ScreenHeader";
import { APP_NAME, DEVELOPER } from "../../constants/app";
import { useTheme } from "../../hooks/useTheme";
import { useT, type Key } from "../../i18n";

/**
 * Text pages from Settings: FAQ, Privacy policy, Terms of use (all in the app language).
 * Route: /info/faq · /info/privacy · /info/terms
 */
type Page = "faq" | "privacy" | "terms";
const PAGES: Record<Page, { title: Key; blocks: { h?: Key; p: Key }[] }> = {
  faq: {
    title: "info.faq",
    blocks: [
      { h: "faq.q1", p: "faq.a1" },
      { h: "faq.q2", p: "faq.a2" },
      { h: "faq.q3", p: "faq.a3" },
      { h: "faq.q4", p: "faq.a4" },
      { h: "faq.q5", p: "faq.a5" },
    ],
  },
  privacy: {
    title: "info.privacy",
    blocks: [
      { p: "privacy.p1" },
      { h: "privacy.h2", p: "privacy.p2" },
      { h: "privacy.h3", p: "privacy.p3" },
      { h: "privacy.h4", p: "privacy.p4" },
    ],
  },
  terms: {
    title: "info.terms",
    blocks: [
      { p: "terms.p1" },
      { h: "terms.h2", p: "terms.p2" },
      { h: "terms.h3", p: "terms.p3" },
      { h: "terms.h4", p: "terms.p4" },
    ],
  },
};

export default function InfoScreen() {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { page } = useLocalSearchParams<{ page: string }>();
  const def = PAGES[(page as Page) in PAGES ? (page as Page) : "faq"];
  const vars = { app: APP_NAME, dev: DEVELOPER };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={t(def.title)} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 32,
          gap: 18,
        }}
      >
        {def.blocks.map((b) => (
          <View
            key={b.p}
            style={[
              styles.block,
              b.h && {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ]}
          >
            {b.h ? (
              <AppText weight="bold" size={16}>
                {t(b.h, vars)}
              </AppText>
            ) : null}
            <AppText
              size={14}
              color={b.h ? "textMuted" : "text"}
              style={{ lineHeight: 21 }}
            >
              {t(b.p, vars)}
            </AppText>
          </View>
        ))}
        <AppText size={12} color="textMuted" align="center">
          {t("info.demoNote")}
        </AppText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 16, padding: 14, gap: 6 },
});
