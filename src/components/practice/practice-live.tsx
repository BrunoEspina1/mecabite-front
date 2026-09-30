import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CheckRow } from '@/components/check-row';
import { Icon } from '@/components/icon';
import { LandmarksOverlay } from '@/components/practice/landmarks-overlay';
import { TorsoGuide } from '@/components/practice/torso-guide';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { TourOverlay } from '@/components/tour/tour-overlay';
import { TourTarget } from '@/components/tour/tour-target';
import { Radius, ScreenTopGap, Spacing } from '@/constants/theme';
import type { Sena, SymbolName } from '@/data/senas';
import { usePracticeSession } from '@/hooks/use-practice-session';
import { useTheme } from '@/hooks/use-theme';
import { useTourStep } from '@/onboarding/tour';
import { HandLandmarkerView, type LandmarksEvent } from '@/modules/hand-landmarker';
import { useApiSettings } from '@/services/api/settings';
import type { ComponentName, FeedbackCode } from '@/services/api/types';

const COMPONENT_LABELS: Record<ComponentName, string> = {
  configuration: 'Configuración',
  orientation: 'Orientación',
  localization: 'Localización',
  movement: 'Movimiento',
};

const REQUIRED_EXECUTIONS = 3;

/** Visual support per feedback_code (never parse `message`). */
const WRONG_ICON: SymbolName = { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' };
const FRAMING_ICON: SymbolName = { ios: 'person.crop.rectangle', android: 'center_focus_strong', web: 'center_focus_strong' };

const FEEDBACK_ICON: Record<FeedbackCode, SymbolName> = {
  show_hand: FRAMING_ICON,
  hold_position: { ios: 'hand.raised.fill', android: 'back_hand', web: 'back_hand' },
  correct: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  approved: { ios: 'star.fill', android: 'star', web: 'star' },
  wrong_configuration: WRONG_ICON,
  wrong_orientation: WRONG_ICON,
  wrong_movement: WRONG_ICON,
  wrong_localization: WRONG_ICON,
  too_slow: WRONG_ICON,
  use_both_hands: WRONG_ICON,
  adjust_framing: FRAMING_ICON,
};

/**
 * Text shown per feedback_code. The backend `message` is not displayed: it can name the sign it
 * thinks you are doing or say how to fix it, and the app only reports what failed.
 */
const FEEDBACK_TITLE: Record<FeedbackCode, string> = {
  show_hand: 'Colócate del torso para arriba',
  hold_position: 'Mantén la posición',
  correct: '¡Bien!',
  approved: '¡Seña aprobada! 🎉',
  wrong_configuration: 'Configuración incorrecta',
  wrong_orientation: 'Orientación incorrecta',
  wrong_movement: 'Movimiento incorrecto',
  wrong_localization: 'Ubicación incorrecta',
  too_slow: 'Movimiento muy lento',
  use_both_hands: 'Faltó una mano',
  adjust_framing: 'Colócate del torso para arriba',
};

const FRAMING_HINT = 'Para reconocer la seña, la cámara debe verte del torso para arriba.';

const WRONG = new Set<FeedbackCode>([
  'wrong_configuration',
  'wrong_orientation',
  'wrong_movement',
  'wrong_localization',
  'too_slow',
  'use_both_hands',
]);

const FRAMING = new Set<FeedbackCode>(['show_hand', 'adjust_framing']);

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Live practice: MediaPipe runs on the phone, landmarks go to the backend (or the mock).
 * A new session starts on "Repetir" or when the connection settings change.
 */
export function PracticeLive({ sena }: { sena: Sena | undefined }) {
  const settings = useApiSettings();
  const [attempt, setAttempt] = useState(0);
  return (
    <PracticeLiveSession
      key={`${attempt}|${settings.useMock}|${settings.baseUrl}`}
      sena={sena}
      onRestart={() => setAttempt((a) => a + 1)}
    />
  );
}

function PracticeLiveSession({ sena, onRestart }: { sena: Sena | undefined; onRestart: () => void }) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [frame, setFrame] = useState<LandmarksEvent | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [seconds, setSeconds] = useState(0);

  const granted = permission?.granted ?? false;
  const tourStep = useTourStep()?.step.id;
  const session = usePracticeSession(sena, granted);
  const { feedback, phase, stats } = session;
  const approved = feedback?.state === 'approved' || session.summary?.approved === true;

  useEffect(() => {
    if (!granted || approved) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [granted, approved]);

  const handleLandmarks = ({ nativeEvent }: { nativeEvent: LandmarksEvent }) => {
    setFrame(nativeEvent);
    session.sendFrame(nativeEvent);
  };


  const connectionLabel = session.isMock
    ? 'Simulado'
    : session.transportStatus === 'open'
      ? 'Conectado'
      : session.transportStatus === 'reconnecting'
        ? 'Reconectando…'
        : 'Sin conexión';

  const header = (
    <ScreenHeader
      title="Modo práctica"
      color={theme.cameraText}
      right={
        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajustes de conexión"
            onPress={() => router.push('/conexion')}
            style={[styles.chip, { backgroundColor: theme.cameraOverlay }]}>
            <View
              style={[
                styles.chipDot,
                { backgroundColor: session.isMock ? theme.accentSecondary : session.transportStatus === 'open' ? theme.success : theme.accent },
              ]}
            />
            <ThemedText type="small" style={{ color: theme.cameraText }}>
              {connectionLabel}
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold" style={{ color: theme.cameraText }}>
            {formatTime(seconds)}
          </ThemedText>
        </View>
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

  const code = feedback?.feedback_code;
  const wrong = !approved && code != null && WRONG.has(code);
  const needsFraming = !approved && phase === 'ready' && (code == null || FRAMING.has(code));
  const title =
    phase === 'error'
      ? 'Sin conexión con el servidor'
      : phase !== 'ready' && phase !== 'ended'
        ? 'Conectando…'
        : code
          ? FEEDBACK_TITLE[code]
          : FEEDBACK_TITLE.show_hand;
  const subtitle =
    phase === 'error'
      ? (session.error ?? '')
      : approved
        ? `Completaste ${sena ? `${sena.tipo.toLowerCase()} ${sena.etiqueta}` : 'la seña'} en ${formatTime(seconds)}`
        : (cameraError ?? session.error ?? (needsFraming ? FRAMING_HINT : null));
  const consecutive = feedback?.consecutive_correct ?? 0;
  const components = feedback
    ? (Object.entries(feedback.components) as [ComponentName, string][]).filter(([, s]) => s !== 'not_required')
    : (['configuration', 'orientation'] as ComponentName[]).map((c) => [c, 'insufficient_data'] as [ComponentName, string]);

  return (
    <View
      style={[styles.flex, { backgroundColor: theme.cameraSurface }]}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      <StatusBar style="light" />
      <HandLandmarkerView
        style={StyleSheet.absoluteFill}
        active={!approved}
        facing={facing}
        numHands={1}
        onLandmarks={handleLandmarks}
        onError={({ nativeEvent }) => setCameraError(nativeEvent.message)}
      />
      <LandmarksOverlay frame={frame} width={size.width} height={size.height} />

      <SafeAreaView style={[styles.flex, styles.padded]} pointerEvents="box-none">
        {header}

        <TourTarget id="practice-framing" style={styles.flex}>
          <View style={styles.spacer} pointerEvents="none">
            {needsFraming || tourStep === 'framing' ? <TorsoGuide /> : null}
          </View>
        </TourTarget>

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
          <TourTarget id="practice-status">
            <View
              style={[
                styles.status,
                { backgroundColor: wrong ? theme.dangerSoft : theme.backgroundElement, borderColor: wrong ? theme.danger : 'transparent' },
              ]}>
              <View style={styles.statusRow}>
                {code || needsFraming ? (
                  <Icon
                    name={code ? FEEDBACK_ICON[code] : FRAMING_ICON}
                    size={wrong ? 26 : 22}
                    color={wrong ? theme.danger : theme.primary}
                  />
                ) : null}
                <ThemedText type="smallBold" style={[styles.statusTitle, wrong && { color: theme.danger }]}>
                  {approved ? FEEDBACK_TITLE.approved : title}
                </ThemedText>
              </View>
              {subtitle ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  {subtitle}
                </ThemedText>
              ) : null}

              {feedback?.progress != null && !approved ? (
                <View style={[styles.track, { backgroundColor: theme.primarySoft }]}>
                  <View style={[styles.fill, { width: `${Math.min(1, feedback.progress) * 100}%`, backgroundColor: theme.primary }]} />
                </View>
              ) : null}

              <View style={styles.executions}>
                {Array.from({ length: REQUIRED_EXECUTIONS }, (_, i) => (
                  <View
                    key={i}
                    style={[styles.execution, { backgroundColor: i < consecutive || approved ? theme.primary : theme.border }]}
                  />
                ))}
              </View>
            </View>
          </TourTarget>

          <TourTarget id="practice-checks">
            <View style={[styles.checks, { backgroundColor: theme.cameraOverlay }]}>
              {components.map(([name, status]) => (
                <CheckRow
                  key={name}
                  label={COMPONENT_LABELS[name]}
                  done={status === 'correct'}
                  error={status === 'incorrect'}
                  color={theme.cameraText}
                />
              ))}
              <ThemedText type="small" style={[styles.stats, { color: theme.cameraText }]}>
                {stats.sendRateHz} Hz · RTT {stats.rttMs ?? '–'} ms
                {stats.dropped ? ` · ${stats.dropped} sin enviar` : ''}
              </ThemedText>
            </View>
          </TourTarget>

          {approved || phase === 'error' ? (
            <View style={styles.actions}>
              <Button title={phase === 'error' ? 'Reintentar' : 'Repetir'} variant="text" style={styles.flex} onPress={onRestart} />
              <Button title="Continuar" style={styles.flex} onPress={() => router.back()} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
      <TourOverlay screen="practica" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  padded: {
    paddingTop: ScreenTopGap,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spacer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
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
    borderWidth: 2,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusTitle: {
    fontSize: 17,
  },
  track: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  executions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  execution: {
    width: 28,
    height: 6,
    borderRadius: Radius.pill,
  },
  checks: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  stats: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
