import { ScreenPlaceholder } from "../../components/ScreenPlaceholder";
import { useTheme } from "../../hooks/useTheme";

export default function ProfileScreen() {
  const colors = useTheme();
  return (
    <ScreenPlaceholder
      title="Profile"
      subtitle="Wallet, settings, help and feedback go here."
      icon="person"
      colors={colors}
    />
  );
}
