import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import type { Sena } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

type SignIconProps = {
  sena: Sena;
  /** Diameter of the circle. */
  size: number;
};

/** Hand drawing of the sign coming out of a tinted circle, or its generic symbol when there is no drawing. */
export function SignIcon({ sena, size }: SignIconProps) {
  const theme = useTheme();
  const hand = size * 0.74;

  const round = { width: size, height: size, borderRadius: size / 2 };

  return (
    // Shadow and clipping live on separate views: overflow hidden would cut the shadow.
    <View style={[styles.shadow, round]}>
      <View
        style={[
          styles.circle,
          round,
          {
            backgroundColor: theme.primaryTint,
            borderColor: theme.primarySoft,
          },
        ]}>
        {sena.image ? (
          // The PNG rests on its bottom edge, so the circle clips the wrist.
          <Image
            source={sena.image}
            style={{ width: hand, height: hand }}
            contentFit="contain"
            accessible={false}
          />
        ) : (
          <View style={styles.symbol}>
            <Icon name={sena.icon} size={size * 0.5} color={theme.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Light depth: a soft lifted shadow outside plus a faint shade at the bottom inside the circle.
  shadow: {
    boxShadow: '0 4px 10px rgba(233, 30, 99, 0.14), 0 1px 3px rgba(233, 30, 99, 0.1)',
  },
  circle: {
    borderWidth: 1,
    boxShadow: 'inset 0 -6px 12px rgba(233, 30, 99, 0.08), inset 0 4px 8px rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  symbol: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
