import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type AppBarProps = {
  title?: string;
  showBack?: boolean;
  /** What goes on the right. Defaults to the brand; pass `null` for nothing. */
  right?: ReactNode;
  /** Colour of the title and the back arrow, for a bar over the camera. */
  color?: string;
};

/**
 * Bar fixed to the top of every screen: back on the left, title, brand on the right. It sits outside the
 * scrolling content and takes the space below the notch itself, so screens add no top padding of their own
 * and the back button is always in the same place.
 */
export function AppBar({ title, showBack = true, right, color }: AppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Regresar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={styles.back}>
            <Icon name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} color={color} />
          </Pressable>
        ) : null}
        <ThemedText type="smallBold" style={[styles.title, color ? { color } : null]} numberOfLines={1}>
          {title}
        </ThemedText>
        {right === undefined ? <Brand /> : right}
      </View>
    </View>
  );
}

/**
 * Wordmark and symbol, side by side. Tapping it takes the app back to the welcome screen, which plays the
 * intro again: a way to restart a demo without relaunching. Nothing shows that it can be tapped.
 */
function Brand() {
  return (
    <Pressable
      accessible={false}
      hitSlop={10}
      onPress={() => {
        if (router.canDismiss()) router.dismissAll();
        router.replace('/');
      }}>
      <View style={styles.brand} accessible accessibilityRole="image" accessibilityLabel="EnSeñas">
        <Image source={require('../../assets/images/brand/ensenas-wordmark.png')} style={styles.wordmark} contentFit="contain" />
        <Image source={require('../../assets/images/brand/ensenas-icon.png')} style={styles.symbol} contentFit="contain" />
      </View>
    </Pressable>
  );
}

const BACK = 44;
const WORDMARK_HEIGHT = 14;
const SYMBOL = 24;

const styles = StyleSheet.create({
  row: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  back: {
    width: BACK,
    height: BACK,
    // The arrow lines up with the content below; the rest of the box is touch area.
    marginLeft: -(BACK - 22) / 2,
    marginRight: -Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    height: WORDMARK_HEIGHT,
    // Proportions of the wordmark artwork (912 x 211).
    width: (WORDMARK_HEIGHT * 912) / 211,
  },
  symbol: {
    width: SYMBOL,
    height: SYMBOL,
  },
});
