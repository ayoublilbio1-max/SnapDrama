import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { CoinIcon } from "../../components/CoinIcon";
import { TAB_BAR_SPACE } from "../../constants/layout";
import {
  CHECKIN_COINS,
  checkInView,
  rewardsActions,
  TASKS,
  taskView,
  useRewards,
  type TaskDef,
} from "../../data/rewards";
import { useUserState } from "../../data/userStore";
import { useVip, VIP_DAILY_COINS } from "../../data/vip";
import { useBalance } from "../../data/wallet";
import { useTheme } from "../../hooks/useTheme";
import { useT } from "../../i18n";
import { canNavigate } from "../../utils/navLock";

/** Rewards tab (demo coins): balance, 7-day check-in, daily + one-time tasks, VIP / coin shop links. */
export default function RewardsScreen() {
  const colors = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const balance = useBalance();
  const vip = useVip();
  const rewards = useRewards();
  const user = useUserState();
  const checkIn = checkInView(rewards);
  const counts = {
    saved: Object.keys(user.saved).length,
    rated: Object.keys(user.ratings).length,
    shared: Object.keys(user.shared).length,
  };

  const [gain, setGain] = useState(0);
  const bump = useSharedValue(1);
  const float = useSharedValue(0);
  const bumpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bump.value }],
  }));
  const floatStyle = useAnimatedStyle(() => ({
    opacity: float.value === 0 ? 0 : 1 - float.value,
    transform: [{ translateY: -30 * float.value }],
  }));

  const celebrate = (coins: number) => {
    setGain(coins);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    bump.value = withSequence(
      withTiming(1.2, { duration: 120 }),
      withSpring(1, { damping: 6, stiffness: 160 }),
    );
    float.value = 0.001;
    float.value = withTiming(1, { duration: 1000 });
  };

  const onCheckIn = async () => {
    const coins = await rewardsActions.checkIn();
    if (coins) celebrate(coins);
  };

  const onTask = async (task: TaskDef, done: boolean) => {
    if (done) {
      await rewardsActions.claim(task);
      celebrate(task.coins);
      return;
    }
    if (!canNavigate(`task ${task.id}`)) return;
    if (__DEV__) console.log(`[rewards] go → ${task.go} (${task.id})`);
    router.navigate(task.go === "feed" ? "/for-you" : "/");
  };

  const daily = TASKS.filter((t) => t.daily);
  const once = TASKS.filter(
    (t) => !t.daily && !taskView(t, rewards, counts).claimed,
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + TAB_BAR_SPACE + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppText weight="bold" size={26}>
          {t("tabs.rewards")}
        </AppText>

        {/* balance */}
        <Pressable
          onPress={() => canNavigate("coins") && router.push("/coins")}
          style={({ pressed }) => [
            styles.balance,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t("rewards.balanceA11y", { n: balance })}
        >
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <AppText size={13} color="onPrimary" style={{ opacity: 0.85 }}>
              {t("rewards.myCoins")}
            </AppText>
            <View style={styles.balanceRow}>
              <CoinIcon size={34} />
              <Animated.View style={bumpStyle}>
                <AppText weight="bold" size={32} color="onPrimary">
                  {balance}
                </AppText>
              </Animated.View>
              <Animated.View style={floatStyle} pointerEvents="none">
                <AppText weight="bold" size={18} style={{ color: colors.gold }}>
                  +{gain}
                </AppText>
              </Animated.View>
            </View>
          </View>
          <View style={[styles.shopPill, { backgroundColor: colors.overlay }]}>
            <AppText weight="semibold" size={13} color="onPrimary">
              {t("profile.coinShop")}
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.onPrimary}
            />
          </View>
        </Pressable>

        {/* check-in */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHead}>
            <AppText weight="bold" size={17}>
              {t("rewards.checkInTitle")}
            </AppText>
            <AppText size={12} color="textMuted">
              {checkIn.done > 0
                ? t(
                    checkIn.done > 1
                      ? "rewards.streakMany"
                      : "rewards.streakOne",
                    { n: checkIn.done },
                  )
                : t("rewards.startStreak")}
            </AppText>
          </View>
          <View style={styles.days}>
            {CHECKIN_COINS.map((coins, i) => {
              const day = i + 1;
              const got = day <= checkIn.done;
              const next = day === checkIn.nextDay;
              const big = day === 7;
              return (
                <View
                  key={day}
                  style={[
                    styles.day,
                    {
                      backgroundColor: got
                        ? colors.goldSoft
                        : colors.surfaceAlt,
                      borderColor: next
                        ? colors.primary
                        : got
                          ? colors.gold
                          : "transparent",
                      flex: big ? 1.4 : 1,
                    },
                  ]}
                >
                  {got ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.gold}
                    />
                  ) : (
                    <CoinIcon size={big ? 22 : 18} glow={false} />
                  )}
                  <AppText
                    weight="bold"
                    size={12}
                    style={{ color: got ? colors.gold : colors.text }}
                  >
                    {coins}
                  </AppText>
                  <AppText size={10} color="textMuted">
                    {t("rewards.day", { n: day })}
                  </AppText>
                </View>
              );
            })}
          </View>
          <Pressable
            disabled={checkIn.doneToday}
            onPress={onCheckIn}
            style={({ pressed }) => [
              styles.btn,
              { opacity: checkIn.doneToday ? 1 : pressed ? 0.85 : 1 },
            ]}
          >
            {checkIn.doneToday ? (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              />
            ) : (
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <AppText
              weight="bold"
              size={15}
              color={checkIn.doneToday ? "textMuted" : "onPrimary"}
            >
              {checkIn.doneToday
                ? t("rewards.checkedIn")
                : t("rewards.checkIn", { n: checkIn.nextCoins })}
            </AppText>
          </Pressable>
        </View>

        {/* VIP */}
        <Pressable
          onPress={() => canNavigate("vip") && router.push("/vip")}
          style={({ pressed }) => [
            styles.vip,
            {
              backgroundColor: colors.goldSoft,
              borderColor: colors.gold,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="diamond" size={22} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" size={15}>
              {vip
                ? t("rewards.vipOn")
                : t("rewards.vipOff", { n: VIP_DAILY_COINS })}
            </AppText>
            <AppText size={12} color="textMuted">
              {vip
                ? t("rewards.vipOnHint", { n: VIP_DAILY_COINS })
                : t("rewards.vipOffHint")}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.gold} />
        </Pressable>

        {/* tasks */}
        <AppText weight="bold" size={17} style={styles.section}>
          {t("rewards.daily")}
        </AppText>
        <View
          style={[
            styles.list,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {daily.map((t, i) => (
            <TaskRow
              key={t.id}
              task={t}
              view={taskView(t, rewards, counts)}
              last={i === daily.length - 1}
              onPress={onTask}
            />
          ))}
        </View>

        {once.length > 0 && (
          <>
            <AppText weight="bold" size={17} style={styles.section}>
              {t("rewards.once")}
            </AppText>
            <View
              style={[
                styles.list,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {once.map((t, i) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  view={taskView(t, rewards, counts)}
                  last={i === once.length - 1}
                  onPress={onTask}
                />
              ))}
            </View>
          </>
        )}

        <AppText
          size={12}
          color="textMuted"
          align="center"
          style={{ marginTop: 18 }}
        >
          {t("rewards.demo")}
        </AppText>
      </ScrollView>
    </View>
  );
}

function TaskRow({
  task,
  view,
  last,
  onPress,
}: {
  task: TaskDef;
  view: { count: number; done: boolean; claimed: boolean };
  last: boolean;
  onPress: (t: TaskDef, done: boolean) => void;
}) {
  const colors = useTheme();
  const t = useT();
  return (
    <View
      style={[
        styles.task,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={[styles.taskIcon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={task.icon} size={18} color={colors.textAccent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText weight="medium" size={14} numberOfLines={1}>
          {t(task.titleKey)}
        </AppText>
        <View style={styles.taskSub}>
          <CoinIcon size={14} glow={false} />
          <AppText size={12} style={{ color: colors.gold }}>
            +{task.coins}
          </AppText>
          {task.goal > 1 && (
            <AppText size={12} color="textMuted">
              · {view.count}/{task.goal}
            </AppText>
          )}
        </View>
      </View>
      {view.claimed ? (
        <View style={styles.claimed}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={colors.textMuted}
          />
          <AppText weight="medium" size={13} color="textMuted">
            {t("rewards.done")}
          </AppText>
        </View>
      ) : (
        <Pressable
          onPress={() => onPress(task, view.done)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.taskBtn,
            {
              backgroundColor: view.done ? colors.primary : "transparent",
              borderColor: colors.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <AppText
            weight="semibold"
            size={13}
            style={{ color: view.done ? colors.onPrimary : colors.textAccent }}
          >
            {view.done ? t("rewards.claim") : t("rewards.go")}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  balance: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    overflow: "hidden",
    padding: 18,
    marginTop: 14,
  },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  shopPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
    gap: 12,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  days: { flexDirection: "row", gap: 6 },
  day: {
    alignItems: "center",
    gap: 2,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 8,
  },
  btn: {
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  vip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  section: { marginTop: 22, marginBottom: 10 },
  list: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14 },
  task: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  taskSub: { flexDirection: "row", alignItems: "center", gap: 4 },
  claimed: { flexDirection: "row", alignItems: "center", gap: 4 },
  taskBtn: {
    minWidth: 64,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
});
