import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from '../constants/colors';

/** Follows the phone (light / dark). Every screen: `const colors = useTheme()`. */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
