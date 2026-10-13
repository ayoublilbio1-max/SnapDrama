import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { useTheme } from '../hooks/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  icon?: IconName;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean; // red confirm button (default true)
  onConfirm: () => void;
  onCancel: () => void;
};

/** Themed replacement for the native Alert. Never use Alert for confirmations. */
export function ConfirmModal({
  visible,
  title,
  message,
  icon = 'trash-outline',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const colors = useTheme();
  const accent = destructive ? colors.danger : colors.primary;

  const handleConfirm = () => {
    if (__DEV__) console.log(`[modal] confirm "${title}"`);
    Haptics.notificationAsync(
      destructive ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
    onConfirm();
  };

  const handleCancel = () => {
    if (__DEV__) console.log(`[modal] cancel "${title}"`);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleCancel}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={handleCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.iconCircle, { backgroundColor: accent + '22' }]}>
            <Ionicons name={icon} size={28} color={accent} />
          </View>
          <AppText weight="bold" size={19} align="center">
            {title}
          </AppText>
          <AppText size={14} color="textMuted" align="center" style={styles.message}>
            {message}
          </AppText>
          <View style={styles.row}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <AppText weight="semibold" size={15}>
                {cancelLabel}
              </AppText>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [styles.btn, { backgroundColor: accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <AppText weight="semibold" size={15} color={destructive ? 'onDanger' : 'onPrimary'}>
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  message: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  btn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
