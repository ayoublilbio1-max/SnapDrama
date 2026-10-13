import { ScreenPlaceholder } from "../../components/ScreenPlaceholder";
import { useTheme } from "../../hooks/useTheme";

// For you follows the phone theme like the other tabs (user decision, v0.1.9).
// The status bar follows automatically (<StatusBar style="auto" /> in the root layout).
export default function ForYouScreen() {
  const colors = useTheme();
  return (
    <ScreenPlaceholder
      title="For you"
      subtitle="The vertical trending feed goes here."
      icon="play-circle"
      colors={colors}
    />
  );
}
