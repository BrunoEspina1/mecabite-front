import { Pressable, StyleSheet, View } from 'react-native';

import { SignIcon } from '@/components/sign-icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Nivel } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

type LevelCardProps = {
  nivel: Nivel;
  onPress: () => void;
};

export function LevelCard({ nivel, onPress }: LevelCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.texts}>
        <ThemedText type="smallBold" style={styles.title}>
          Nivel {nivel.id}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {nivel.titulo}
        </ThemedText>
        <ThemedText type="smallBold" style={[styles.preview, { color: theme.primary }]}>
          {nivel.subtitulo}
        </ThemedText>
      </View>
      <SignIcon item={nivel} size={72} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
  },
  preview: {
    marginTop: Spacing.two,
    letterSpacing: 2,
  },
});
