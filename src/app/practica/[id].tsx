import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CheckRow } from '@/components/check-row';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getSena } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

// Mock: one check is marked every CHECK_INTERVAL_MS until the recognition backend exists.
const CHECK_INTERVAL_MS = 1500;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 4. Modo práctica (en tiempo real) */
export default function PracticaScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sena = getSena(id);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [seconds, setSeconds] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [attempt, setAttempt] = useState(0);

  const checks = ['Configuración', 'Orientación', 'Localización', ...(sena?.movimiento ? ['Movimiento'] : [])];
  const completed = doneCount >= checks.length;
  const granted = permission?.granted ?? false;

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

  const restart = () => {
    setDoneCount(0);
    setSeconds(0);
    setAttempt((a) => a + 1);
  };

  const header = (
    <ScreenHeader
      title="Modo práctica"
      color={theme.cameraText}
      right={
        <ThemedText type="smallBold" style={{ color: theme.cameraText }}>
          {formatTime(seconds)}
        </ThemedText>
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
      <SafeAreaView style={[styles.flex, styles.padded, { backgroundColor: theme.cameraSurface }]}>
        <StatusBar style="light" />
        {header}
        <View style={styles.permission}>
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

      <SafeAreaView style={[styles.flex, styles.padded]} pointerEvents="box-none">
        {header}

        {/* Framing corners */}
        <View style={styles.frame} pointerEvents="none">
          <View style={[styles.corner, styles.tl, { borderColor: theme.cameraText }]} />
          <View style={[styles.corner, styles.tr, { borderColor: theme.cameraText }]} />
          <View style={[styles.corner, styles.bl, { borderColor: theme.cameraText }]} />
          <View style={[styles.corner, styles.br, { borderColor: theme.cameraText }]} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar cámara"
          onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
          style={[styles.flip, { backgroundColor: theme.cameraOverlay }]}>
          <Icon
            name={{ ios: 'arrow.triangle.2.circlepath.camera', android: 'flip_camera_ios', web: 'flip_camera_ios' }}
            size={24}
            color={theme.cameraText}
          />
        </Pressable>

        <View style={styles.bottom}>
          <View style={[styles.status, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" style={styles.statusTitle}>
              {completed ? '¡Bien hecho! 🎉' : 'Mantén la posición'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {completed
                ? `Completaste ${sena ? `${sena.tipo.toLowerCase()} ${sena.etiqueta}` : 'la seña'} en ${formatTime(seconds)}`
                : 'Verificando configuración y orientación…'}
            </ThemedText>
          </View>

          <View style={[styles.checks, { backgroundColor: theme.cameraOverlay }]}>
            {checks.map((label, i) => (
              <CheckRow key={label} label={label} done={i < doneCount} color={theme.cameraText} />
            ))}
          </View>

          {completed ? (
            <View style={styles.actions}>
              <Button title="Repetir" variant="text" style={styles.flex} onPress={restart} />
              <Button title="Continuar" style={styles.flex} onPress={() => router.back()} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
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
    position: 'absolute',
    top: 72,
    right: Spacing.four,
    width: 44,
    height: 44,
    borderRadius: 22,
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
  checks: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
