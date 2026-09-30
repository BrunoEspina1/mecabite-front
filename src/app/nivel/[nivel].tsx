import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { SegmentedLevels } from '@/components/segmented-levels';
import { SignTile } from '@/components/sign-tile';
import { ThemedText } from '@/components/themed-text';
import { ScreenTopGap, Spacing } from '@/constants/theme';
import { getNivel, getSenasByNivel } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

/** 8. Catálogo de señas */
export default function CatalogoScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ nivel: string }>();
  const nivel = getNivel(params.nivel);
  const senas = getSenasByNivel(nivel.id);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader />
        <ThemedText type="subtitle">{nivel.titulo}</ThemedText>
        <SegmentedLevels value={nivel.id} onChange={(id) => router.setParams({ nivel: id })} />

        <View style={styles.grid}>
          {senas.map((sena) => (
            <SignTile
              key={sena.id}
              sena={sena}
              onPress={() => router.push({ pathname: '/sena/[id]', params: { id: sena.id } })}
            />
          ))}
        </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
});
