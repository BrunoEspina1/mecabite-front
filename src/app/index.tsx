import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppVersion } from '@/components/app-version';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Entrance: the logo appears on white, holds, and then the white clears while the rest comes in.
const LOGO_IN_MS = 500;
const LOGO_HOLD_MS = 450;
const REVEAL_MS = 450;
const STAGGER_MS = 110;
/** How far each element rises as it comes in. */
const RISE = 12;

/** Opacity plus a short rise, both driven by the same 0 → 1 value. */
const entering = (value: Animated.Value) => ({
  opacity: value,
  transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] }) }],
});

/** 1. Pantalla de inicio / Splash */
export default function WelcomeScreen() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const [intro] = useState(() => ({
    logo: new Animated.Value(0),
    white: new Animated.Value(1),
    tagline: new Animated.Value(0),
    actions: new Animated.Value(0),
  }));

  useEffect(() => {
    let cancelled = false;
    const { logo, white, tagline, actions } = intro;
    const rise = (value: Animated.Value) =>
      Animated.timing(value, { toValue: 1, duration: REVEAL_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true });

    const entrance = Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: LOGO_IN_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(LOGO_HOLD_MS),
      Animated.parallel([
        Animated.timing(white, { toValue: 0, duration: REVEAL_MS, useNativeDriver: true }),
        Animated.stagger(STAGGER_MS, [rise(tagline), rise(actions)]),
      ]),
    ]);

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) {
        [logo, tagline, actions].forEach((value) => value.setValue(1));
        white.setValue(0);
        setReady(true);
      } else {
        entrance.start(() => !cancelled && setReady(true));
      }
    });

    return () => {
      cancelled = true;
      entrance.stop();
    };
  }, [intro]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTop, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.blob, styles.blobAccent, { backgroundColor: theme.accentSecondary }]} />

      {/* Same white as the native splash screen, so the app opens without a cut. */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.white, { opacity: intro.white }]} pointerEvents="none" />

      {/* Centred on the whole screen, not on the space left above the button. */}
      <View style={[StyleSheet.absoluteFill, styles.hero]} pointerEvents="none">
        <Animated.View
          style={{
            opacity: intro.logo,
            transform: [{ scale: intro.logo.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
          }}>
          <Image
            source={require('../../assets/images/brand/ensenas-logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="EnSeñas"
          />
        </Animated.View>
        <Animated.View style={entering(intro.tagline)}>
          <ThemedText themeColor="textSecondary">Aprende. Practica. Comunica.</ThemedText>
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safe} pointerEvents="box-none">
        <Animated.View style={entering(intro.actions)} pointerEvents={ready ? 'auto' : 'none'}>
          <Button title="Comenzar" onPress={() => router.replace('/inicio')} />
          <AppVersion style={styles.version} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  white: {
    backgroundColor: Palette.white,
  },
  safe: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  version: {
    marginTop: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  logo: {
    // Proportions of the logo artwork (912 x 920).
    width: 220,
    height: (220 * 920) / 912,
  },
  blob: {
    position: 'absolute',
    borderRadius: Radius.pill,
  },
  blobTop: {
    width: 320,
    height: 320,
    top: -140,
    right: -120,
    opacity: 0.6,
  },
  blobBottom: {
    width: 280,
    height: 280,
    bottom: -120,
    left: -110,
    opacity: 0.5,
  },
  blobAccent: {
    width: 90,
    height: 90,
    bottom: 180,
    right: -30,
    opacity: 0.25,
  },
});
