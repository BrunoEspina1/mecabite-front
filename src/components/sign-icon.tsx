import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import type { Sena } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

type SignIconProps = {
  /** A sign or a level: anything with a hand drawing and a fallback symbol. */
  item: Pick<Sena, 'image' | 'icon'>;
  /** Diameter of the circle. */
  size: number;
  /** Approved in practice: the circle gets a thick ring in the app's main colour. */
  completed?: boolean;
};

/** Hand drawing coming out of a tinted circle, or the generic symbol when there is no drawing. */
export function SignIcon({ item, size, completed = false }: SignIconProps) {
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
            borderColor: completed ? theme.primary : theme.primarySoft,
          },
          completed && styles.completed,
        ]}>
        {item.image ? (
          // The PNG rests on its bottom edge, so the circle clips the wrist.
          <Image
            source={item.image}
            style={{ width: hand, height: hand }}
            contentFit="contain"
            accessible={false}
          />
        ) : (
          <View style={styles.symbol}>
            <Icon name={item.icon} size={size * 0.5} color={theme.primary} />
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
  completed: {
    borderWidth: 4,
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
