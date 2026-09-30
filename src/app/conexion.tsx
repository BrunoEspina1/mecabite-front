import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppVersion } from '@/components/app-version';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, ScreenTopGap, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/services/api/client';
import { getDeviceId, restUrl, updateApiSettings, useApiSettings } from '@/services/api/settings';

type Check = { state: 'idle' | 'loading' | 'ok' | 'error'; message?: string };

/** Backend connection settings (the laptop IP changes with the Wi-Fi network). */
export default function AjustesScreen() {
  const theme = useTheme();
  const settings = useApiSettings();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [participantId, setParticipantId] = useState(settings.participantId);
  const [check, setCheck] = useState<Check>({ state: 'idle' });

  const save = () => updateApiSettings({ baseUrl, participantId: participantId.trim() || 'p01' });

  const testConnection = async () => {
    save();
    setCheck({ state: 'loading' });
    try {
      const health = await api.health();
      const catalog = await api.catalog().catch(() => null);
      setCheck({
        state: 'ok',
        message: `Servidor ${health.status} (${health.environment})${catalog ? ` · ${catalog.signs.length} señas en el catálogo` : ''}`,
      });
    } catch (e) {
      setCheck({ state: 'error', message: e instanceof ApiError ? e.message : 'Error desconocido' });
    }
  };

  const inputStyle = [styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Ajustes de conexión" />

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">Backend simulado</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Responde dentro de la app mientras las sesiones del servidor no existen. Cualquier mano visible cuenta como correcta.
              </ThemedText>
            </View>
            <Switch
              value={settings.useMock}
              onValueChange={(useMock) => updateApiSettings({ useMock })}
              trackColor={{ true: theme.primary }}
            />
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">URL del servidor</ThemedText>
          <TextInput
            value={baseUrl}
            onChangeText={setBaseUrl}
            onBlur={save}
            placeholder="http://192.168.1.20:8000"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={inputStyle}
          />
          <ThemedText type="small" themeColor="textSecondary">
            En el iPhone usa la IP de la laptop (`ipconfig getifaddr en0`), no localhost. REST: {restUrl(settings.baseUrl)}
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">ID de participante</ThemedText>
          <TextInput
            value={participantId}
            onChangeText={setParticipantId}
            onBlur={save}
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Dispositivo: {getDeviceId()}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">Guardar landmarks para entrenamiento</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Envía `record: true`. Solo con el consentimiento de la persona. Nunca se envía video.
              </ThemedText>
            </View>
            <Switch
              value={settings.record}
              onValueChange={(record) => updateApiSettings({ record })}
              trackColor={{ true: theme.primary }}
            />
          </View>
        </View>

        <Button title={check.state === 'loading' ? 'Probando…' : 'Probar conexión'} onPress={testConnection} />
        {check.message ? (
          <ThemedText
            type="small"
            style={[styles.center, { color: check.state === 'ok' ? theme.success : theme.accent }]}>
            {check.message}
          </ThemedText>
        ) : null}
        <AppVersion />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: ScreenTopGap,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
    gap: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  center: {
    textAlign: 'center',
  },
});
