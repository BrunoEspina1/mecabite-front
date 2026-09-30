import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppVersion } from '@/components/app-version';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, ScreenTopGap, Spacing } from '@/constants/theme';
import { NIVELES } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

// Mock progress until the backend exists.
const PROGRESO: Record<string, number> = { '1': 0.6, '2': 0.2, '3': 0 };

export default function ProgresoScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Tu progreso</ThemedText>
        {NIVELES.map((nivel) => {
          const value = PROGRESO[nivel.id] ?? 0;
          return (
            <View key={nivel.id} style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <View style={styles.row}>
                <ThemedText type="smallBold">
                  Nivel {nivel.id} · {nivel.titulo}
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  {Math.round(value * 100)}%
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.primarySoft }]}>
                <View style={[styles.fill, { width: `${value * 100}%`, backgroundColor: theme.primary }]} />
              </View>
            </View>
          );
        })}
        <Button title="Ajustes de conexión" variant="text" onPress={() => router.push('/ajustes')} />
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
