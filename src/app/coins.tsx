import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../components/AppText";
import { CoinIcon } from "../components/CoinIcon";
import { ConfirmModal } from "../components/ConfirmModal";
import { ScreenHeader } from "../components/ScreenHeader";
import { useVip, VIP_DAILY_COINS } from "../data/vip";
import {
  useBalance,
  useCoinHistory,
  walletActions,
  type CoinEntry,
} from "../data/wallet";
import { useTheme } from "../hooks/useTheme";

/** DEMO coin shop — payments are simulated, the coins are just added (brief §8). Linked with VIP. */
const PACKS = [
  { id: "p100", coins: 100, bonus: 0, price: "$0.99", tag: "" },
  { id: "p300", coins: 300, bonus: 30, price: "$2.99", tag: "" },
  { id: "p500", coins: 500, bonus: 100, price: "$4.99", tag: "Popular" },
  { id: "p1000", coins: 1000, bonus: 250, price: "$9.99", tag: "" },
  { id: "p2000", coins: 2000, bonus: 600, price: "$19.99", tag: "Best value" },
  { id: "p5000", coins: 5000, bonus: 2000, price: "$49.99", tag: "" },
] as const;
type Pack = (typeof PACKS)[number];

const GAP = 10;

export default function CoinsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const vip = useVip();
  const balance = useBalance();
  const history = useCoinHistory();
  const [pick, setPick] = useState<Pack | null>(null);
  const tileW = Math.floor((width - 32 - GAP) / 2);

  const bump = useSharedValue(1);
  const bumpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bump.value }],
  }));

  const buy = () => {
    if (!pick) return;
    const total = pick.coins + pick.bonus;
    walletActions.buy(
      total,
      `Coin pack ${pick.coins}${pick.bonus ? ` + ${pick.bonus} bonus` : ""}`,
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    bump.value = withSequence(
      withTiming(1.25, { duration: 120 }),
      withSpring(1, { damping: 6, stiffness: 160 }),
    );
    setPick(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Coins" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* balance */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <AppText size={13} color="onPrimary" style={{ opacity: 0.85 }}>
            Your balance
          </AppText>
          <View style={styles.balanceRow}>
            <CoinIcon size={40} />
            <Animated.View style={bumpStyle}>
              <AppText weight="bold" size={36} color="onPrimary">
                {balance}
              </AppText>
            </Animated.View>
          </View>
          <AppText size={12} color="onPrimary" style={{ opacity: 0.85 }}>
            Use coins to unlock episodes
          </AppText>
        </View>

        {/* link to VIP: watch without coins */}
        <Pressable
          onPress={() => router.push("/vip")}
          style={({ pressed }) => [
            styles.vipLink,
            {
              backgroundColor: colors.goldSoft,
              borderColor: colors.gold,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="VIP"
        >
          <Ionicons name="diamond" size={22} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" size={15}>
              {vip ? "You are VIP" : "Go VIP — no coins needed"}
            </AppText>
            <AppText size={12} color="textMuted">
              {vip
                ? `Episodes unlock free · +${VIP_DAILY_COINS} coins every day`
                : `Unlock every episode free + ${VIP_DAILY_COINS} coins a day`}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gold} />
        </Pressable>

        {/* packs */}
        <AppText weight="bold" size={18} style={styles.section}>
          Get coins
        </AppText>
        <View style={styles.grid}>
          {PACKS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPick(p);
              }}
              style={({ pressed }) => [
                styles.pack,
                {
                  width: tileW,
                  backgroundColor: p.tag ? colors.goldSoft : colors.surface,
                  borderColor: p.tag ? colors.gold : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${p.coins} coins${p.bonus ? ` plus ${p.bonus} bonus` : ""}, ${p.price}`}
            >
              {p.tag ? (
                <View style={[styles.tag, { backgroundColor: colors.gold }]}>
                  <AppText weight="bold" size={10} color="onPrimary">
                    {p.tag}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.packCoins}>
                <CoinIcon size={24} glow={false} />
                <AppText weight="bold" size={20}>
                  {p.coins}
                </AppText>
              </View>
              <AppText
                weight="semibold"
                size={12}
                style={{ color: colors.gold, minHeight: 17 }}
              >
                {p.bonus ? `+${p.bonus} bonus` : " "}
              </AppText>
              <View style={[styles.price, { backgroundColor: colors.primary }]}>
                <AppText weight="bold" size={14} color="onPrimary">
                  {p.price}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
        <AppText
          size={12}
          color="textMuted"
          align="center"
          style={{ marginTop: 10 }}
        >
          Demo mode — payments are simulated for this showcase.
        </AppText>

        {/* history */}
        <AppText weight="bold" size={18} style={styles.section}>
          Coin history
        </AppText>
        {history.length === 0 ? (
          <AppText size={14} color="textMuted">
            No coins used yet.
          </AppText>
        ) : (
          <View
            style={[
              styles.historyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {history.map((h, i) => (
              <HistoryRow key={h.id} item={h} last={i === history.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!pick}
        icon="wallet-outline"
        title={pick ? `Buy ${pick.coins + pick.bonus} coins?` : ""}
        message={
          pick
            ? `${pick.price}. Demo mode: the payment is simulated and the coins are added to this phone.`
            : ""
        }
        confirmLabel="Buy"
        destructive={false}
        onConfirm={buy}
        onCancel={() => setPick(null)}
      />
    </View>
  );
}

const ICONS: Record<
  CoinEntry["kind"],
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  welcome: "gift-outline",
  reward: "gift-outline",
  buy: "cart-outline",
  unlock: "lock-open-outline",
};

function formatWhen(at: number) {
  const d = new Date(at);
  const pad = (v: number) => String(v).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function HistoryRow({ item, last }: { item: CoinEntry; last: boolean }) {
  const colors = useTheme();
  const plus = item.amount > 0;
  return (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: plus ? colors.goldSoft : colors.surfaceAlt },
        ]}
      >
        <Ionicons
          name={ICONS[item.kind]}
          size={16}
          color={plus ? colors.gold : colors.textAccent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="medium" size={14} numberOfLines={1}>
          {item.label}
        </AppText>
        <AppText size={12} color="textMuted">
          {formatWhen(item.at)}
        </AppText>
      </View>
      <AppText
        weight="bold"
        size={15}
        style={{ color: plus ? colors.gold : colors.textMuted }}
      >
        {plus ? `+${item.amount}` : `−${Math.abs(item.amount)}`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: 22,
    overflow: "hidden",
    padding: 20,
    gap: 6,
    marginTop: 6,
  },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  vipLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  section: { marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  pack: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 4,
    alignItems: "center",
    overflow: "hidden",
  },
  tag: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 10,
  },
  packCoins: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  price: {
    alignSelf: "stretch",
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  historyCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
