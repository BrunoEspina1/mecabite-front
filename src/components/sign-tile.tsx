import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { SignIcon } from '@/components/sign-icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Sena } from '@/data/senas';

type SignTileProps = {
  sena: Sena;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Circle with the sign's hand and its name below, no card behind. */
export function SignTile({ sena, onPress, style }: SignTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${sena.tipo} ${sena.etiqueta}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, style, pressed && styles.pressed]}>
      <SignIcon sena={sena} size={96} />
      <ThemedText type="smallBold" style={styles.label} numberOfLines={2}>
        {sena.etiqueta}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    // Three columns: 2 gaps of Spacing.two between them.
    width: '31.5%',
    flexGrow: 0,
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
});
