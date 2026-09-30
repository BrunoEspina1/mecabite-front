import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/app-bar';
import { AppVersion } from '@/components/app-version';
import { Icon } from '@/components/icon';
import { Segmented } from '@/components/segmented';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import type { SymbolName } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';
import { restartTour } from '@/onboarding/tour';
import { HAND_OPTIONS, updatePreferences, usePreferences } from '@/services/preferences';

type SettingsRowProps = {
  icon: SymbolName;
  title: string;
  detail: string;
  onPress: () => void;
};

function SettingsRow({ icon, title, detail, onPress }: SettingsRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.primaryTint : theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Icon name={icon} size={22} color={theme.primary} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {detail}
        </ThemedText>
      </View>
      <Icon
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
        color={theme.textSecondary}
      />
    </Pressable>
  );
}

export default function AjustesScreen() {
  const theme = useTheme();
  const preferences = usePreferences();
  const dark = preferences.theme === 'dark';

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppBar title="Ajustes" showBack={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsRow
          icon={{ ios: 'questionmark.circle.fill', android: 'help', web: 'help' }}
          title="Ver tutorial"
          detail="Cómo funciona la app, paso a paso"
          onPress={() => {
            // The tour starts on Inicio.
            restartTour();
            router.navigate('/inicio');
          }}
        />
        <SettingsRow
          icon={{ ios: 'wifi', android: 'wifi', web: 'wifi' }}
          title="Ajustes de conexión"
          detail="Servidor que evalúa las señas"
          onPress={() => router.push('/conexion')}
        />
        <SettingsRow
          icon={{ ios: 'hand.raised.fill', android: 'privacy_tip', web: 'privacy_tip' }}
          title="Aviso de privacidad"
          detail="Cómo usamos tus datos"
          onPress={() => router.push('/privacidad')}
        />
        <SettingsRow
          icon={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
          title="Términos y condiciones"
          detail="Condiciones de uso y fuentes de las señas"
          onPress={() => router.push('/terminos')}
        />

        <View style={[styles.card, styles.hand, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">Mano con la que haces las señas</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              En la práctica solo se revisa esa mano.
            </ThemedText>
          </View>
          <Segmented options={HAND_OPTIONS} value={preferences.hand} onChange={(hand) => updatePreferences({ hand })} />
        </View>

        {/* Whatever space is left: the theme switch sits at the bottom of it, in the middle. */}
        <View style={styles.rest}>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Modo oscuro"
            accessibilityState={{ checked: dark }}
            onPress={() => updatePreferences({ theme: dark ? 'light' : 'dark' })}
            style={({ pressed }) => [
              styles.themeSwitch,
              { backgroundColor: pressed ? theme.primaryTint : theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Icon
              name={
                dark
                  ? { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' }
                  : { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' }
              }
              size={28}
              color={theme.primary}
            />
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            {dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          </ThemedText>
        </View>

        <AppVersion />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.four,
    paddingTop: Spacing.two,
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
  hand: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  rest: {
    flex: 1,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.two,
  },
  themeSwitch: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
