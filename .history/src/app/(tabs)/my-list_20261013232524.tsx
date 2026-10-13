import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { useTheme } from '../../hooks/useTheme';

export default function MyListScreen() {
  const colors = useTheme();
  return (
    <ScreenPlaceholder title="My list" subtitle="Saved series and Continue watching go here." icon="bookmark" colors={colors} />
  );
}
