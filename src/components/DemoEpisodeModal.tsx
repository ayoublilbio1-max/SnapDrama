import { Linking } from "react-native";
import { FIVERR_URL } from "../constants/app";
import { InfoModal } from "./InfoModal";

/**
 * "This is a demo" popup (brief §8): an unlocked episode that has no video (not uploaded).
 * Never the native Alert.
 */
export function DemoEpisodeModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <InfoModal
      visible={visible}
      icon="sparkles-outline"
      title="This is a demo"
      message="This episode isn't included in the demo — only the free episodes can be watched. To get the full app, contact the developer."
      actionLabel="Contact the developer"
      onAction={() => {
        onClose();
        if (__DEV__) console.log("[paywall] demo → open Fiverr");
        Linking.openURL(FIVERR_URL).catch((e) => {
          if (__DEV__)
            console.log("[paywall] could not open Fiverr", String(e));
        });
      }}
      onClose={onClose}
    />
  );
}
