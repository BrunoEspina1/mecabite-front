import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppVersion } from '@/components/app-version';
import { Button } from '@/components/button';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { HAND_OPTIONS, updatePreferences, usePreferences } from '@/services/preferences';

// Entrance: the logo video plays on white, then the white clears while the rest comes in.
const INTRO = require('../../assets/videos/intro.mp4');
/** The video lasts 6 s; at this speed it takes 4. */
const INTRO_SPEED = 1.5;
/** If the video hasn't finished by then, the app goes on without it. */
const INTRO_TIMEOUT_MS = 7000;
const REVEAL_MS = 450;
const STAGGER_MS = 110;
/** How far each element rises as it comes in. */
const RISE = 12;
/**
 * Width given to the video so that its logo is as big as the one on the screen underneath.
 * Its sides, which are empty white, fall outside the screen.
 */
const VIDEO_WIDTH = 694;

/** Opacity plus a short rise, both driven by the same 0 → 1 value. */
const entering = (value: Animated.Value) => ({
  opacity: value,
  transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] }) }],
});

/** 1. Pantalla de inicio / Splash */
export default function WelcomeScreen() {
  const theme = useTheme();
  const { hand } = usePreferences();
  const [ready, setReady] = useState(false);
  // Asked once: the first time the app opens. Afterwards it lives in Ajustes.
  const [askHand] = useState(hand === null);
  const [intro] = useState(() => ({
    logo: new Animated.Value(0),
    white: new Animated.Value(1),
    tagline: new Animated.Value(0),
    actions: new Animated.Value(0),
  }));
  const revealed = useRef(false);

  const player = useVideoPlayer(INTRO, (video) => {
    video.muted = true;
    video.loop = false;
    video.playbackRate = INTRO_SPEED;
    // Never interrupt whatever the person is listening to.
    video.audioMixingMode = 'mixWithOthers';
  });

  /** Crossfades from the video to the screen. Runs once, whatever asks for it first. */
  const reveal = useCallback(
    (animated: boolean) => {
      if (revealed.current) return;
      revealed.current = true;
      const { logo, white, tagline, actions } = intro;
      if (!animated) {
        [logo, tagline, actions].forEach((value) => value.setValue(1));
        white.setValue(0);
        setReady(true);
        return;
      }
      const show = (value: Animated.Value) =>
        Animated.timing(value, { toValue: 1, duration: REVEAL_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true });
      Animated.parallel([
        Animated.timing(white, { toValue: 0, duration: REVEAL_MS, useNativeDriver: true }),
        show(logo),
        Animated.stagger(STAGGER_MS, [show(tagline), show(actions)]),
      ]).start(() => setReady(true));
    },
    [intro],
  );

  useEventListener(player, 'playToEnd', () => reveal(true));
  useEventListener(player, 'statusChange', ({ status }) => {
    // A video that can't be played must not leave the app on a white screen.
    if (status === 'error') reveal(true);
  });

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      if (reduceMotion) reveal(false);
      else player.play();
    });
    const timeout = setTimeout(() => reveal(true), INTRO_TIMEOUT_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [player, reveal]);

  const hero = (
    <>
      <Animated.View style={{ opacity: intro.logo }}>
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
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTop, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.blob, styles.blobAccent, { backgroundColor: theme.accentSecondary }]} />

      {/* Centred on the whole screen, not on the space left above the button. The first time, the hand
          question needs that space, so the logo takes what is left above it instead. */}
      {askHand ? null : (
        <View style={[StyleSheet.absoluteFill, styles.hero]} pointerEvents="none">
          {hero}
        </View>
      )}

      <SafeAreaView style={styles.safe} pointerEvents="box-none">
        {askHand ? <View style={[styles.hero, styles.heroInFlow]}>{hero}</View> : null}
        <Animated.View style={entering(intro.actions)} pointerEvents={ready ? 'auto' : 'none'}>
          {askHand ? (
            <View style={styles.hand}>
              <ThemedText type="smallBold" style={styles.centered}>
                ¿Con qué mano haces las señas?
              </ThemedText>
              <Segmented options={HAND_OPTIONS} value={hand} onChange={(value) => updatePreferences({ hand: value })} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
                Puedes cambiarla después en Ajustes.
              </ThemedText>
            </View>
          ) : null}
          <Button
            title="Comenzar"
            disabled={hand === null}
            style={hand === null && styles.disabled}
            onPress={() => router.replace('/inicio')}
          />
          <AppVersion style={styles.version} />
        </Animated.View>
      </SafeAreaView>

      {/* Covers everything while the video plays. Same white as the native splash screen and as the video,
          so the app opens without a cut; it goes away once the screen has been revealed. */}
      {ready ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, styles.white, { opacity: intro.white }]} pointerEvents="none">
          <VideoView
            player={player}
            nativeControls={false}
            contentFit="contain"
            allowsPictureInPicture={false}
            style={styles.video}
          />
        </Animated.View>
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: VIDEO_WIDTH,
    aspectRatio: 16 / 9,
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
  hand: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  centered: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  heroInFlow: {
    flex: 1,
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
