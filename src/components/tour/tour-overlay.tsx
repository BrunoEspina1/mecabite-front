import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
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
} from '@/onboarding/tour';

const DIM = 'rgba(20, 20, 24, 0.62)';
const HOLE_PADDING = 6;
const CARD_GAP = 12;
// The dim is one view with a huge border around the hole, which gives the cutout rounded corners.
const DIM_BORDER = 2000;
// Makes an empty view take the touch so nothing underneath receives it.
const swallow = { collapsable: false, onStartShouldSetResponder: () => true } as const;

/**
 * Tour layer for one screen: dims everything except the highlighted element and shows the step's card.
 * Render it as the last child of the screen's root view.
 */
export function TourOverlay({ screen }: { screen: TourScreen }) {
  const theme = useTheme();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const current = useTourStep();
  const step = current?.step.screen === screen ? current.step : null;
  const rect = useTargetRect(step?.target);
  const ref = useRef<View>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  // Going back to an earlier screen mid-tour rewinds to this screen's step instead of losing the tour.
  useFocusEffect(useCallback(() => syncTourToScreen(screen), [screen]));

  // The overlay's own window position, to turn the target's window coordinates into local ones.
  const measureOrigin = () => ref.current?.measureInWindow((x, y) => setOrigin({ x, y }));

  if (!current || !step) return null;

  const { width, height } = window;
  const measured = !step.target || (rect !== null && origin !== null);
  const hole =
    step.target && rect && origin
      ? {
          x: rect.x - origin.x - HOLE_PADDING,
          y: rect.y - origin.y - HOLE_PADDING,
          width: rect.width + HOLE_PADDING * 2,
          height: rect.height + HOLE_PADDING * 2,
        }
      : null;
  const radius = Math.min((step.radius ?? Radius.md) + HOLE_PADDING, hole ? hole.height / 2 : 0);
  const isLast = current.index === TOUR_STEPS.length - 1;
  // Card below the element when it is in the top half, above it otherwise.
  const cardPosition = hole
    ? hole.y + hole.height / 2 < height / 2
      ? { top: hole.y + hole.height + CARD_GAP }
      : { bottom: height - hole.y + CARD_GAP }
    : styles.cardCentered;

  return (
    <View ref={ref} style={[StyleSheet.absoluteFill, styles.layer]} pointerEvents="box-none" onLayout={measureOrigin}>
      {hole ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.cutout,
              {
                top: hole.y - DIM_BORDER,
                left: hole.x - DIM_BORDER,
                width: hole.width + DIM_BORDER * 2,
                height: hole.height + DIM_BORDER * 2,
                borderRadius: DIM_BORDER + radius,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.ring,
              { top: hole.y, left: hole.x, width: hole.width, height: hole.height, borderRadius: radius, borderColor: theme.primary },
            ]}
          />
          {/* Invisible panels that swallow taps around the hole; the hole itself only opens on action steps. */}
          <View {...swallow} style={[styles.block, { top: 0, left: 0, right: 0, height: Math.max(0, hole.y) }]} />
          <View {...swallow} style={[styles.block, { top: hole.y + hole.height, left: 0, right: 0, bottom: 0 }]} />
          <View {...swallow} style={[styles.block, { top: hole.y, left: 0, width: Math.max(0, hole.x), height: hole.height }]} />
          <View
            {...swallow}
            style={[styles.block, { top: hole.y, left: hole.x + hole.width, width: Math.max(0, width - hole.x - hole.width), height: hole.height }]}
          />
          {!step.action ? <View {...swallow} style={[styles.block, { top: hole.y, left: hole.x, width: hole.width, height: hole.height }]} /> : null}
        </>
      ) : (
        // No target, or still measuring it: cover everything so nothing underneath can be tapped.
        <View {...swallow} style={[StyleSheet.absoluteFill, measured && { backgroundColor: DIM }]} />
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

      {measured ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }, cardPosition]}>
          <View style={styles.texts}>
            <ThemedText type="smallBold" style={styles.title}>
              {step.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {step.text}
            </ThemedText>
          </View>
          {step.action ? (
            <Icon name={{ ios: 'hand.tap.fill', android: 'touch_app', web: 'touch_app' }} size={26} color={theme.primary} />
          ) : (
            <Pressable
              accessibilityRole="button"
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
        </View>
      ) : null}
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
