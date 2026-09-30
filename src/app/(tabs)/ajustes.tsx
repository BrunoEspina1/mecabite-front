import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, ScreenTopGap, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { restartTour } from '@/onboarding/tour';

export default function AjustesScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Ajustes</ThemedText>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            // The tour starts on Inicio.
            restartTour();
            router.navigate('/inicio');
          }}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: pressed ? theme.primaryTint : theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Icon name={{ ios: 'questionmark.circle.fill', android: 'help', web: 'help' }} size={22} color={theme.primary} />
          <View style={styles.flex}>
            <ThemedText type="smallBold">Ver tutorial</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              Cómo funciona la app, paso a paso
            </ThemedText>
          </View>
          <Icon
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            color={theme.textSecondary}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/privacidad')}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: pressed ? theme.primaryTint : theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Icon name={{ ios: 'hand.raised.fill', android: 'privacy_tip', web: 'privacy_tip' }} size={22} color={theme.primary} />
          <View style={styles.flex}>
            <ThemedText type="smallBold">Aviso de privacidad</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              Cómo usamos tus datos
            </ThemedText>
          </View>
          <Icon
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            color={theme.textSecondary}
          />
        </Pressable>
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
  flex: {
    flex: 1,
    gap: Spacing.one,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
