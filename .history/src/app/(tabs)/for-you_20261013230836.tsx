import { StatusBar } from "expo-status-bar";
import { ScreenPlaceholder } from "../../components/ScreenPlaceholder";
import { darkColors } from "../../constants/colors";

// Video feed screen: always dark, whatever the phone theme.
export default function ForYouScreen() {
  return (
    <>
      <StatusBar style="light" />
      <ScreenPlaceholder
        title="For you"
        subtitle="The vertical trending feed goes here (always dark)."
        icon="play-circle"
        colors={darkColors}
      />
    </>
  );
}
