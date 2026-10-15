import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { CoinIcon } from "../components/CoinIcon";
import { ConfirmModal } from "../components/ConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";
import {
  VIP_PLANS as PLANS,
  useVip,
  VIP_DAILY_COINS,
  vipActions,
  type PlanId,
} from "../data/vip";
import { useBalance } from "../data/wallet";
import { useTheme } from "../hooks/useTheme";

/**
 * DEMO VIP page — simulated payment, the plan is saved on the phone (src/data/vip.ts).
 * VIP really works in the demo: locked episodes unlock free + daily bonus coins.
 * Linked with the coin shop (pay per episode instead).
 */

const BENEFITS: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  text: string;
}[] = [
  { icon: "lock-open", text: "Unlock every episode of every series" },
  { icon: "ban", text: "No ads, ever" },
  { icon: "sparkles", text: "New episodes first" },
  { icon: "gift", text: `${VIP_DAILY_COINS} bonus coins every day` },
  { icon: "film", text: "Full HD quality" },
];

export default function VipScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const active = useVip();
  const balance = useBalance();
  const [selected, setSelected] = useState<PlanId>("monthly");
  const [confirm, setConfirm] = useState<"buy" | "cancel" | null>(null);

  const plan = PLANS.find((p) => p.id === selected)!;

  const activate = () => {
    setConfirm(null);
    vipActions.activate(selected);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  };

  const cancel = () => {
    setConfirm(null);
    vipActions.cancel();
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
          Demo mode — payments are simulated for this showcase.
        </AppText>

        {/* link to the coin shop: pay per episode instead */}
        <Pressable
          onPress={() => router.push("/coins")}
          style={({ pressed }) => [
            styles.coinsLink,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Coin shop"
        >
          <CoinIcon size={30} glow={false} />
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" size={15}>
              {active ? "Your coins" : "Prefer to pay per episode?"}
            </AppText>
            <AppText size={12} color="textMuted">
              Balance {balance} coins · coin packs & history
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={confirm === "buy"}
        icon="diamond"
        title={`Get ${plan.name} VIP?`}
        message={`${plan.price} ${plan.per}. Demo mode: the payment is simulated and your VIP plan is saved on this phone.`}
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
  coinsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 22,
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
