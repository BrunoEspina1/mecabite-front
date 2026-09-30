import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CheckRow } from '@/components/check-row';
import { Icon } from '@/components/icon';
import { AppBar } from '@/components/app-bar';
import { SignIcon } from '@/components/sign-icon';
import { SignVideo } from '@/components/sign-video/sign-video';
import { ThemedText } from '@/components/themed-text';
import { TourOverlay } from '@/components/tour/tour-overlay';
import { TourTarget } from '@/components/tour/tour-target';
import { Radius, Spacing } from '@/constants/theme';
import { getSena, getSenasByNivel } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';
import { completeTourAction, useTourStep } from '@/onboarding/tour';
import { useCompletedSigns } from '@/services/progress';

/** 3. Video y descripción de la seña */
export default function SenaScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sena = getSena(id);
  const scrollRef = useRef<ScrollView>(null);
  const tourStep = useTourStep()?.step.id;
  const completed = useCompletedSigns().has(id);

  // The indications and the start button can be below the fold: bring them into view for the tour.
  useEffect(() => {
    if (tourStep === 'indications' || tourStep === 'start-practice') scrollRef.current?.scrollToEnd({ animated: true });
  }, [tourStep]);

  if (!sena) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
        <AppBar />
        <View style={styles.content}>
          <ThemedText>Seña no encontrada.</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const delNivel = getSenasByNivel(sena.nivel);
  const posicion = delNivel.findIndex((s) => s.id === sena.id) + 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      {/* No brand on this screen: the bar only carries where you are and whether the sign is done. */}
      <AppBar
        title={`Nivel ${sena.nivel} · ${sena.tipo} ${sena.etiqueta}`}
        right={
          completed ? (
            <View style={[styles.tag, { backgroundColor: theme.successSoft }]}>
              <Icon
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                size={14}
                color={theme.success}
              />
              <ThemedText type="smallBold" style={[styles.tagText, { color: theme.successStrong }]}>
                Completado
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.tagText}>
              {posicion}/{delNivel.length}
            </ThemedText>
          )
        }
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <TourTarget id="sign-video">
          {sena.video ? (
            <SignVideo sena={{ ...sena, video: sena.video }} />
          ) : (
            // Placeholder for the signs that don't have a video yet.
            <View style={[styles.video, { backgroundColor: theme.primarySoft }]}>
              <SignIcon item={sena} size={140} />
              <View style={[styles.play, { backgroundColor: theme.backgroundElement }]}>
                <Icon name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={28} color={theme.primary} />
              </View>
              <View style={styles.progressRow}>
                <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
                <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]} />
              </View>
            </View>
          )}
        </TourTarget>

        <View style={styles.texts}>
          <ThemedText type="subtitle">
            {sena.tipo} {sena.etiqueta}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {sena.descripcion}
          </ThemedText>
        </View>

        <TourTarget id="sign-indications">
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <CheckRow
              label="Configuración"
              detail={sena.configuracion}
              icon={{ ios: 'hand.raised', android: 'back_hand', web: 'back_hand' }}
            />
            <CheckRow
              label="Orientación"
              detail={sena.orientacion}
              icon={{ ios: 'safari', android: 'explore', web: 'explore' }}
            />
            <CheckRow
              label="Localización"
              detail={sena.localizacion}
              icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
            />
            {sena.movimiento ? (
              <CheckRow
                label="Movimiento"
                detail={sena.movimiento}
                icon={{ ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }}
              />
            ) : null}
          </View>
        </TourTarget>

        <TourTarget id="sign-start">
          <Button
            title="Comenzar práctica"
            onPress={() => {
              completeTourAction('sign-start');
              router.push({ pathname: '/practica/[id]', params: { id: sena.id } });
            }}
          />
        </TourTarget>
      </ScrollView>
      <TourOverlay screen="sena" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  video: {
    aspectRatio: 16 / 11,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  play: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.95,
  },
  progressRow: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: Radius.pill,
    marginLeft: -4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  tagText: {
    fontSize: 13,
    lineHeight: 18,
  },
  texts: {
    gap: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.three,
  },
});
