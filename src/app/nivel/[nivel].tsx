import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { SegmentedLevels } from '@/components/segmented-levels';
import { SignTile } from '@/components/sign-tile';
import { ThemedText } from '@/components/themed-text';
import { TourOverlay } from '@/components/tour/tour-overlay';
import { TourTarget } from '@/components/tour/tour-target';
import { ScreenTopGap, Spacing } from '@/constants/theme';
import { getNivel, getSenasByNivel } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';
import { completeTourAction } from '@/onboarding/tour';

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
        <TourTarget id="level-tabs">
          <SegmentedLevels value={nivel.id} onChange={(id) => router.setParams({ nivel: id })} />
        </TourTarget>

        <View style={styles.grid}>
          {senas.map((sena, i) => {
            const open = () => {
              if (i === 0) completeTourAction('first-sign');
              router.push({ pathname: '/sena/[id]', params: { id: sena.id } });
            };
            // The first tile is the one the tour asks to open.
            return i === 0 ? (
              <TourTarget key={sena.id} id="first-sign" style={styles.column}>
                <SignTile sena={sena} onPress={open} style={styles.fill} />
              </TourTarget>
            ) : (
              <SignTile key={sena.id} sena={sena} onPress={open} />
            );
          })}
        </View>
      </ScrollView>
      <TourOverlay screen="nivel" />
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
  column: {
    width: '31.5%',
  },
  fill: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
