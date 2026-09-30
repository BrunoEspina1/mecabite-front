import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CheckRow } from '@/components/check-row';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { SignAnimation3D } from '@/components/sign-animation-3d';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getSignAnimation } from '@/data/sign-animations';
import { getSena, getSenasByNivel } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

/** 3. Video y descripción de la seña */
export default function SenaScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sena = getSena(id);

  if (!sena) {
    return (
      <SafeAreaView style={[styles.safe, styles.content, { backgroundColor: theme.background }]}>
        <ScreenHeader />
        <ThemedText>Seña no encontrada.</ThemedText>
      </SafeAreaView>
    );
  }

  const delNivel = getSenasByNivel(sena.nivel);
  const posicion = delNivel.findIndex((s) => s.id === sena.id) + 1;
  const animation = getSignAnimation(sena.id);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title={`Nivel ${sena.nivel} · ${sena.tipo} ${sena.etiqueta}`}
          right={
            <ThemedText type="small" themeColor="textSecondary">
              {posicion}/{delNivel.length}
            </ThemedText>
          }
        />

        {animation ? (
          <SignAnimation3D animation={animation} />
        ) : (
          /* Video placeholder (mock until real content exists) */
          <View style={[styles.video, { backgroundColor: theme.primarySoft }]}>
          <Icon name={sena.icon} size={96} color={theme.primary} />
          <View style={[styles.play, { backgroundColor: theme.backgroundElement }]}>
            <Icon name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={28} color={theme.primary} />
          </View>
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]} />
          </View>
          </View>
        )}

        <View style={styles.texts}>
          <ThemedText type="subtitle">
            {sena.tipo} {sena.etiqueta}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {sena.descripcion}
          </ThemedText>
        </View>

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

        <Button
          title="Comenzar práctica"
          onPress={() => router.push({ pathname: '/practica/[id]', params: { id: sena.id } })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
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
