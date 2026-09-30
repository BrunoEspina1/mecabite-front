import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { Sena } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

type SignTileProps = {
  sena: Sena;
  onPress: () => void;
};

export function SignTile({ sena, onPress }: SignTileProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sena.tipo} ${sena.etiqueta}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Icon name={sena.icon} size={44} color={theme.primary} />
      <ThemedText type="smallBold" style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
        {sena.etiqueta}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: '31%',
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
  },
  label: {
    fontSize: 18,
  },
});
