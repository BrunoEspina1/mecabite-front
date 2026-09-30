import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 1. Pantalla de inicio / Splash */
export default function WelcomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTop, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.blob, styles.blobAccent, { backgroundColor: theme.accentSecondary }]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: theme.backgroundElement }]}>
            <Icon name={{ ios: 'hand.wave', android: 'waving_hand', web: 'waving_hand' }} size={88} color={theme.primary} />
          </View>
          <ThemedText type="title">SeñaFácil</ThemedText>
          <ThemedText themeColor="textSecondary">Aprende. Practica. Comunica.</ThemedText>
        </View>

        <Button title="Comenzar" onPress={() => router.replace('/inicio')} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.four,
  },
  blob: {
    position: 'absolute',
    borderRadius: Radius.pill,
  },
  blobTop: {
    width: 320,
    height: 320,
    top: -140,
    right: -120,
    opacity: 0.6,
  },
  blobBottom: {
    width: 280,
    height: 280,
    bottom: -120,
    left: -110,
    opacity: 0.5,
  },
  blobAccent: {
    width: 90,
    height: 90,
    bottom: 180,
    right: -30,
    opacity: 0.25,
  },
});
