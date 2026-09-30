import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/app-bar';
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { TorsoGuide } from '@/components/practice/torso-guide';
import { ThemedText } from '@/components/themed-text';
import { TourOverlay } from '@/components/tour/tour-overlay';
import { TourTarget } from '@/components/tour/tour-target';
import { Radius, Spacing } from '@/constants/theme';
import type { Sena } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';
import { useTourStep } from '@/onboarding/tour';
import { markSignCompleted } from '@/services/progress';

// Mock: one check is marked every CHECK_INTERVAL_MS until the recognition backend exists.
const CHECK_INTERVAL_MS = 1500;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Practice with expo-camera and simulated checks (platforms without the MediaPipe module). */
export function PracticeSimulated({ sena }: { sena: Sena | undefined }) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [seconds, setSeconds] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [guideArea, setGuideArea] = useState({ width: 0, height: 0 });

  // One simulated check per thing a real session reviews: signs with movement take one more.
  const checks = sena?.movimiento ? 4 : 3;
  const completed = doneCount >= checks;
  const granted = permission?.granted ?? false;
  const tourStep = useTourStep()?.step.id;

  // Stopwatch
  useEffect(() => {
    if (!granted || completed) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [granted, completed]);

  // Simulated verification
  useEffect(() => {
    if (!granted || completed) return;
    const timer = setTimeout(() => setDoneCount((c) => c + 1), CHECK_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [granted, completed, doneCount, attempt]);

  useEffect(() => {
    if (completed && sena) markSignCompleted(sena.id);
  }, [completed, sena]);

  const restart = () => {
    setDoneCount(0);
    setSeconds(0);
    setAttempt((a) => a + 1);
  };

  // No brand here: the right of the bar is for the camera switch.
  const appBar = (withCamera: boolean) => (
    <AppBar
      title="Modo práctica"
      color={theme.cameraText}
      right={
        withCamera ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar cámara"
            onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
            style={[styles.flip, { backgroundColor: theme.cameraOverlay }]}>
            <Icon
              name={{ ios: 'arrow.triangle.2.circlepath.camera', android: 'flip_camera_ios', web: 'flip_camera_ios' }}
              size={22}
              color={theme.cameraText}
            />
          </Pressable>
        ) : null
      }
    />
  );

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: theme.cameraSurface }]}>
        <ActivityIndicator color={theme.cameraText} />
      </View>
    );
  }

  if (!granted) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.cameraSurface }]} edges={['bottom', 'left', 'right']}>
        <StatusBar style="light" />
        {appBar(false)}
        <View style={[styles.permission, styles.padded]}>
          <Icon name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }} size={56} color={theme.primary} />
          <ThemedText type="smallBold" style={[styles.centerText, { color: theme.cameraText }]}>
            Necesitamos acceso a tu cámara para verificar tu seña.
          </ThemedText>
          {permission.canAskAgain ? (
            <Button title="Permitir cámara" style={styles.stretch} onPress={requestPermission} />
          ) : (
            <ThemedText type="small" style={[styles.centerText, { color: theme.cameraText }]}>
              Activa el permiso de cámara desde los ajustes del dispositivo.
            </ThemedText>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.cameraSurface }]}>
      <StatusBar style="light" />
      <CameraView style={StyleSheet.absoluteFill} facing={facing} mirror={facing === 'front'} />

      {appBar(true)}
      <SafeAreaView style={[styles.flex, styles.padded]} edges={['bottom', 'left', 'right']} pointerEvents="box-none">
        {/* Framing corners */}
        <TourTarget id="practice-framing" style={styles.flex}>
          <View
            style={styles.frame}
            pointerEvents="none"
            onLayout={(e) => setGuideArea({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
            <View style={[styles.corner, styles.tl, { borderColor: theme.cameraText }]} />
            <View style={[styles.corner, styles.tr, { borderColor: theme.cameraText }]} />
            <View style={[styles.corner, styles.bl, { borderColor: theme.cameraText }]} />
            <View style={[styles.corner, styles.br, { borderColor: theme.cameraText }]} />
            {tourStep === 'framing' ? (
              <View style={styles.guide}>
                <TorsoGuide width={guideArea.width} height={guideArea.height} />
              </View>
            ) : null}
          </View>
        </TourTarget>

        <View style={styles.bottom}>
          <TourTarget id="practice-status">
            <View style={[styles.status, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold" style={styles.statusTitle}>
                {completed ? '¡Bien hecho! 🎉' : 'Mantén la posición'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                {completed
                  ? `Completaste ${sena ? `${sena.tipo.toLowerCase()} ${sena.etiqueta}` : 'la seña'} en ${formatTime(seconds)}`
                  : 'Para reconocer la seña, la cámara debe verte del torso para arriba.'}
              </ThemedText>
            </View>
          </TourTarget>

          {completed ? (
            <View style={styles.actions}>
              <Button title="Repetir" variant="overlay" style={styles.flex} onPress={restart} />
              <Button title="Continuar" style={styles.flex} onPress={() => router.back()} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
      <TourOverlay screen="practica" />
    </View>
  );
}

const CORNER = 36;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  frame: {
    flex: 1,
    marginVertical: Spacing.four,
    marginHorizontal: Spacing.three,
  },
  guide: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: Radius.md },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: Radius.md },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: Radius.md },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: Radius.md },
  flip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    gap: Spacing.three,
  },
  status: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
