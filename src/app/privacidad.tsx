import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppVersion } from '@/components/app-version';
import { CheckRow } from '@/components/check-row';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radius, ScreenTopGap, Spacing } from '@/constants/theme';
import { AVISO_ACTUALIZADO, AVISO_RESUMEN, AVISO_SECCIONES } from '@/data/aviso-privacidad';
import { useTheme } from '@/hooks/use-theme';

/** Privacy notice, opened from Ajustes. The text lives in `@/data/aviso-privacidad`. */
export default function PrivacidadScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Aviso de privacidad" />

        <View style={styles.intro}>
          <ThemedText type="subtitle">Tu privacidad en SeñaFácil</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Última actualización: {AVISO_ACTUALIZADO}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.primaryTint, borderColor: theme.primarySoft }]}>
          <ThemedText type="smallBold">En resumen</ThemedText>
          {AVISO_RESUMEN.map((punto) => (
            <CheckRow key={punto} label={punto} done />
          ))}
        </View>

        {AVISO_SECCIONES.map((seccion) => (
          <View key={seccion.titulo} style={styles.section}>
            <ThemedText type="smallBold" style={styles.sectionTitle}>
              {seccion.titulo}
            </ThemedText>
            {seccion.parrafos?.map((parrafo) => (
              <ThemedText key={parrafo} type="small" themeColor="textSecondary">
                {parrafo}
              </ThemedText>
            ))}
            {seccion.puntos?.map((punto) => (
              <View key={punto} style={styles.bullet}>
                <ThemedText type="small" style={{ color: theme.primary }}>
                  •
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
                  {punto}
                </ThemedText>
              </View>
            ))}
            {seccion.nota ? (
              <ThemedText type="small" themeColor="textSecondary">
                {seccion.nota}
              </ThemedText>
            ) : null}
          </View>
        ))}

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
  },
  intro: {
    gap: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
  },
  bullet: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
