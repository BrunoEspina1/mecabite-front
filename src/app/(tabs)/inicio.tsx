import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppVersion } from '@/components/app-version';
import { LevelCard } from '@/components/level-card';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, ScreenTopGap, Spacing } from '@/constants/theme';
import { NIVELES } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

/** 2. Selección de niveles */
export default function NivelesScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">¿Qué nivel quieres aprender hoy?</ThemedText>

        <View style={styles.list}>
          {NIVELES.map((nivel) => (
            <LevelCard
              key={nivel.id}
              nivel={nivel}
              onPress={() => router.push({ pathname: '/nivel/[nivel]', params: { nivel: nivel.id } })}
            />
          ))}
        </View>
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
    gap: Spacing.four,
  },
  list: {
    gap: Spacing.three,
  },
});
