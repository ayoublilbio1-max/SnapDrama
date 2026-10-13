import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText } from './AppText';
import type { ThemeColors } from '../constants/colors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Temporary body for tabs that are not built yet (base setup only). */
export function ScreenPlaceholder({
  title,
  subtitle,
  icon,
  colors,
  children,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  colors: ThemeColors;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '22' }]}>
        <Ionicons name={icon} size={30} color={colors.scheme === 'dark' ? colors.glow : colors.primary} />
      </View>
      <AppText weight="bold" size={26} style={{ color: colors.text }}>
        {title}
      </AppText>
      <AppText size={14} align="center" style={{ color: colors.textMuted }}>
        {subtitle}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 10 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
});
