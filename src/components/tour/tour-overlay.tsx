import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  TOUR_STEPS,
  nextTourStep,
  skipTour,
  syncTourToScreen,
  useTargetRect,
  useTourStep,
  type TourScreen,
  type TourStep,
} from '@/onboarding/tour';

const DIM = 'rgba(20, 20, 24, 0.62)';
const HOLE_PADDING = 6;
const CARD_GAP = 12;
// The dim is one view with a huge border around the hole, which gives the cutout rounded corners.
const DIM_BORDER = 2000;
// Makes an empty view take the touch so nothing underneath receives it.
const swallow = { collapsable: false, onStartShouldSetResponder: () => true } as const;

// Only opacity and scale are animated: they cost nothing, unlike moving or resizing the dim.
const CARD_FADE_MS = 140;
const RING_PULSE = { duration: 220, easing: Easing.out(Easing.cubic) };
/** How much bigger the ring starts before it closes on the element. */
const RING_GROW = 0.08;

type Hole = { x: number; y: number; width: number; height: number; radius: number };
/** What is on screen: a step together with the hole it was measured for. */
type Shown = { step: TourStep; index: number; hole: Hole | null };

function sameShown(a: Shown | null, b: Shown) {
  if (!a || a.step !== b.step) return false;
  if (!a.hole || !b.hole) return a.hole === b.hole;
  return (
    a.hole.x === b.hole.x &&
    a.hole.y === b.hole.y &&
    a.hole.width === b.hole.width &&
    a.hole.height === b.hole.height &&
    a.hole.radius === b.hole.radius
  );
}

/**
 * Tour layer for one screen: dims everything except the highlighted element and shows the step's card.
 * Render it as the last child of the screen's root view.
 */
export function TourOverlay({ screen }: { screen: TourScreen }) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const current = useTourStep();
  const step = current?.step.screen === screen ? current.step : null;
  const rect = useTargetRect(step?.target);
  const ref = useRef<View>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);

  // Going back to an earlier screen mid-tour rewinds to this screen's step instead of losing the tour.
  useFocusEffect(useCallback(() => syncTourToScreen(screen), [screen]));

  // The overlay's own window position, to turn the target's window coordinates into local ones.
  const measureOrigin = () => ref.current?.measureInWindow((x, y) => setOrigin({ x, y }));

  const hole: Hole | null =
    step?.target && rect && origin
      ? {
          x: rect.x - origin.x - HOLE_PADDING,
          y: rect.y - origin.y - HOLE_PADDING,
          width: rect.width + HOLE_PADDING * 2,
          height: rect.height + HOLE_PADDING * 2,
          radius: Math.min((step.radius ?? Radius.md) + HOLE_PADDING, rect.height / 2 + HOLE_PADDING),
        }
      : null;

  // A step shows once its element has been found. Until then the previous step stays on screen,
  // so the card and the hole always change together.
  const ready: Shown | null = current && step && (!step.target || hole) ? { step, index: current.index, hole } : null;
  if (!step && shown) setShown(null);
  else if (ready && !sameShown(shown, ready)) setShown(ready);

  // The ring closes on each new element, which draws the eye to where the hole went.
  const pulse = useSharedValue(1);
  const shownId = shown?.step.id;
  useEffect(() => {
    if (!shownId) return;
    pulse.set(0);
    pulse.set(withTiming(1, RING_PULSE));
  }, [shownId, pulse]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: pulse.get(),
    transform: [{ scale: 1 + (1 - pulse.get()) * RING_GROW }],
  }));

  if (!step) return null;

  // While the next step's element is being found the card on screen is the previous one: it no longer responds.
  const pending = shown?.step !== step;
  const box = shown?.hole ?? null;
  const isLast = shown?.index === TOUR_STEPS.length - 1;
  // Card below the element when it is in the top half, above it otherwise.
  const cardPosition = box
    ? box.y + box.height / 2 < height / 2
      ? { top: box.y + box.height + CARD_GAP }
      : { bottom: height - box.y + CARD_GAP }
    : styles.cardCentered;

  return (
    <View ref={ref} style={[StyleSheet.absoluteFill, styles.layer]} pointerEvents="box-none" onLayout={measureOrigin}>
      {!shown ? (
        // Still finding the first element: cover everything so nothing underneath can be tapped.
        <View {...swallow} style={StyleSheet.absoluteFill} />
      ) : (
        <>
          {box ? (
            <>
              <View
                pointerEvents="none"
                style={[
                  styles.cutout,
                  {
                    top: box.y - DIM_BORDER,
                    left: box.x - DIM_BORDER,
                    width: box.width + DIM_BORDER * 2,
                    height: box.height + DIM_BORDER * 2,
                    borderRadius: DIM_BORDER + box.radius,
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.ring,
                  { top: box.y, left: box.x, width: box.width, height: box.height, borderRadius: box.radius, borderColor: theme.primary },
                  ringStyle,
                ]}
              />
              {/* Invisible panels that swallow taps around the hole; the hole itself only opens on action steps. */}
              <View {...swallow} style={[styles.block, { top: 0, left: 0, right: 0, height: Math.max(0, box.y) }]} />
              <View {...swallow} style={[styles.block, { top: box.y + box.height, left: 0, right: 0, bottom: 0 }]} />
              <View {...swallow} style={[styles.block, { top: box.y, left: 0, width: Math.max(0, box.x), height: box.height }]} />
              <View
                {...swallow}
                style={[styles.block, { top: box.y, left: box.x + box.width, width: Math.max(0, width - box.x - box.width), height: box.height }]}
              />
              {!shown.step.action || pending ? (
                <View {...swallow} style={[styles.block, { top: box.y, left: box.x, width: box.width, height: box.height }]} />
              ) : null}
            </>
          ) : (
            <View {...swallow} style={[StyleSheet.absoluteFill, styles.dim]} />
          )}

          {!isLast ? (
            <Pressable
              accessibilityRole="button"
              onPress={skipTour}
              hitSlop={10}
              style={[styles.skip, { top: insets.top + Spacing.two, backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Saltar</ThemedText>
            </Pressable>
          ) : null}

          <Animated.View
            key={shown.step.id}
            entering={FadeIn.duration(CARD_FADE_MS)}
            style={[styles.card, { backgroundColor: theme.backgroundElement }, cardPosition]}>
            <View style={styles.texts}>
              <ThemedText type="smallBold" style={styles.title}>
                {shown.step.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {shown.step.text}
              </ThemedText>
            </View>
            {shown.step.action ? (
              <Icon name={{ ios: 'hand.tap.fill', android: 'touch_app', web: 'touch_app' }} size={26} color={theme.primary} />
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={pending}
                onPress={() => {
                  nextTourStep();
                  // The tour ends inside practice mode: close it and leave the person on Inicio.
                  if (isLast) router.dismissTo('/inicio');
                }}
                hitSlop={8}
                style={({ pressed }) => [styles.next, { backgroundColor: pressed ? theme.primaryPressed : theme.primary }]}>
                <ThemedText type="smallBold" style={{ color: theme.textOnPrimary }}>
                  {isLast ? 'Terminar' : 'Siguiente'}
                </ThemedText>
              </Pressable>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 100,
    elevation: 100,
    overflow: 'hidden',
  },
  cutout: {
    position: 'absolute',
    borderWidth: DIM_BORDER,
    borderColor: DIM,
  },
  dim: {
    backgroundColor: DIM,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  block: {
    position: 'absolute',
  },
  skip: {
    position: 'absolute',
    right: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.pill,
  },
  card: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    boxShadow: '0 6px 18px rgba(20, 20, 24, 0.22)',
  },
  cardCentered: {
    top: '38%',
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  next: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
});
