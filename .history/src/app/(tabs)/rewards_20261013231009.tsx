import { ScreenPlaceholder } from "../../components/ScreenPlaceholder";
import { useTheme } from "../../hooks/useTheme";

export default function RewardsScreen() {
  const colors = useTheme();
  return (
    <ScreenPlaceholder
      title="Rewards"
      subtitle="Coins, daily check-in and the coin shop go here."
      icon="gift"
      colors={colors}
    />
  );
}
