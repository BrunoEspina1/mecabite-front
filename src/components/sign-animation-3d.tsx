import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HandScene, type HandView } from '@/components/hand-3d/hand-scene';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { ANIMATION_CREDIT, type SignAnimation } from '@/data/sign-animations';
import { useTheme } from '@/hooks/use-theme';

const VIEWS: { value: HandView; label: string }[] = [
  { value: 'front', label: 'Frente' },
  { value: 'side', label: 'Lado' },
];

/** Card with the 3D hand, Frente/Lado presets, pause and speed controls. Drag to rotate. */
export function SignAnimation3D({ animation }: { animation: SignAnimation }) {
  const theme = useTheme();
  const [view, setView] = useState<HandView>('front');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 0.5>(1);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <HandScene
          animation={animation}
          view={view}
          playing={playing}
          speed={speed}
          background={theme.backgroundElement}
        />

        <View style={styles.views} pointerEvents="box-none">
          {VIEWS.map((option) => {
            const active = option.value === view;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setView(option.value)}
                style={[styles.pill, { backgroundColor: active ? theme.primary : theme.background }]}>
                <ThemedText type="smallBold" style={{ color: active ? theme.textOnPrimary : theme.textSecondary }}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.controls} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pausar' : 'Reproducir'}
            onPress={() => setPlaying((p) => !p)}
            style={[styles.control, { backgroundColor: theme.background }]}>
            <Icon
              name={
                playing
                  ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                  : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
              }
              size={18}
              color={theme.primary}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar velocidad"
            onPress={() => setSpeed((s) => (s === 1 ? 0.5 : 1))}
            style={[styles.control, { backgroundColor: theme.background }]}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {speed === 1 ? '1×' : '0.5×'}
            </ThemedText>
          </Pressable>
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.hint} pointerEvents="none">
          Arrastra para girar
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.credit}>
        {ANIMATION_CREDIT}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  card: {
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  views: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  control: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three + 10,
    fontSize: 12,
    lineHeight: 16,
  },
  credit: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
  },
});
