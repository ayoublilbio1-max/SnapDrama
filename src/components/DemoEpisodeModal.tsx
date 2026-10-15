import { Linking } from "react-native";
import { FIVERR_URL } from "../constants/app";
import { useT } from "../i18n";
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
  const t = useT();
  return (
    <InfoModal
      visible={visible}
      icon="sparkles-outline"
      title={t("demo.title")}
      message={t("demo.episode")}
      actionLabel={t("common.contactDev")}
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
