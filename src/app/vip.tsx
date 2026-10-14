import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Storage from "expo-sqlite/kv-store";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { CoinIcon } from "../components/CoinIcon";
import { ConfirmModal } from "../components/ConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTheme } from "../hooks/useTheme";

/** DEMO VIP page — fake plans, no real payment. The chosen plan is saved on the phone only. */
const PLANS = [
  { id: "weekly", name: "Weekly", price: "$4.99", per: "/ week", note: "" },
  {
    id: "monthly",
    name: "Monthly",
    price: "$14.99",
    per: "/ month",
    note: "Most popular",
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$79.99",
    per: "/ year",
    note: "Save 55%",
  },
] as const;
type PlanId = (typeof PLANS)[number]["id"];

const BENEFITS: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
}[] = [
  { icon: "lock-open", text: "Unlock every episode of every series" },
  { icon: "ban", text: "No ads, ever" },
  { icon: "sparkles", text: "New episodes first" },
  { icon: "gift", text: "100 bonus coins every day" },
  { icon: "film", text: "Full HD quality" },
];

const VIP_KEY = "vip.plan";

export default function VipScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PlanId>("monthly");
  const [active, setActive] = useState<PlanId | null>(null);
  const [confirm, setConfirm] = useState<"buy" | "cancel" | null>(null);

  useEffect(() => {
    Storage.getItem(VIP_KEY)
      .then((v) => {
        if (v && PLANS.some((p) => p.id === v)) setActive(v as PlanId);
        if (__DEV__) console.log(`[vip] saved plan: ${v ?? "none"}`);
      })
      .catch(() => {});
  }, []);

  const plan = PLANS.find((p) => p.id === selected)!;

  const activate = () => {
    setConfirm(null);
    setActive(selected);
    Storage.setItem(VIP_KEY, selected).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    if (__DEV__) console.log(`[vip] demo subscribe ${selected}`);
  };

  const cancel = () => {
    setConfirm(null);
    setActive(null);
    Storage.removeItem(VIP_KEY).catch(() => {});
    if (__DEV__) console.log("[vip] demo cancel");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="VIP" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View style={styles.hero}>
          <CoinIcon size={84} />
          <AppText weight="bold" size={26} style={{ marginTop: 18 }}>
            SnapDrama{" "}
            <AppText weight="bold" size={26} style={{ color: colors.gold }}>
              VIP
            </AppText>
          </AppText>
          <AppText size={14} color="textMuted" align="center">
            {active
              ? `You are VIP · ${PLANS.find((p) => p.id === active)?.name} plan`
              : "Watch every drama without waiting or coins."}
          </AppText>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefit}>
              <View
                style={[
                  styles.benefitIcon,
                  { backgroundColor: colors.goldSoft },
                ]}
              >
                <Ionicons name={b.icon} size={16} color={colors.gold} />
              </View>
              <AppText size={14} style={{ flex: 1 }}>
                {b.text}
              </AppText>
            </View>
          ))}
        </View>

        {!active &&
          PLANS.map((p) => {
            const on = p.id === selected;
            return (
              <Pressable
                key={p.id}
                onPress={() => {
                  setSelected(p.id);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={[
                  styles.plan,
                  {
                    backgroundColor: on ? colors.goldSoft : colors.surface,
                    borderColor: on ? colors.gold : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={on ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={on ? colors.gold : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold" size={16}>
                    {p.name}
                  </AppText>
                  {p.note ? (
                    <AppText size={12} style={{ color: colors.gold }}>
                      {p.note}
                    </AppText>
                  ) : null}
                </View>
                <AppText weight="bold" size={18}>
                  {p.price}
                  <AppText size={12} color="textMuted">
                    {" "}
                    {p.per}
                  </AppText>
                </AppText>
              </Pressable>
            );
          })}

        <Pressable
          onPress={() => setConfirm(active ? "cancel" : "buy")}
          style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.85 : 1 }]}
        >
          {!active && (
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <AppText
            weight="bold"
            size={16}
            color={active ? "danger" : "onPrimary"}
          >
            {active ? "Cancel VIP (demo)" : `Get VIP · ${plan.price}`}
          </AppText>
        </Pressable>

        <AppText
          size={12}
          color="textMuted"
          align="center"
          style={{ marginTop: 10 }}
        >
          Demo app — no real payment is made.
        </AppText>
      </ScrollView>

      <ConfirmModal
        visible={confirm === "buy"}
        icon="diamond"
        title={`Get ${plan.name} VIP?`}
        message={`${plan.price} ${plan.per}. This is a demo: no money is taken, VIP is only saved on this phone.`}
        confirmLabel="Get VIP"
        destructive={false}
        onConfirm={activate}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        visible={confirm === "cancel"}
        icon="close-circle-outline"
        title="Cancel VIP?"
        message="You will lose the VIP benefits in this demo."
        confirmLabel="Cancel VIP"
        cancelLabel="Keep VIP"
        onConfirm={cancel}
        onCancel={() => setConfirm(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingVertical: 18, gap: 6 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  benefit: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  plan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 10,
  },
  cta: {
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
});
