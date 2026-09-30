import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppVersion } from '@/components/app-version';
import { AppBar } from '@/components/app-bar';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { LegalText } from '@/data/legal';
import { useTheme } from '@/hooks/use-theme';

type LegalDocumentProps = {
  /** Short name for the header bar. */
  header: string;
  text: LegalText;
};

/** A legal text as a screen: its title and date, then its numbered sections. */
export function LegalDocument({ header, text }: LegalDocumentProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
      <AppBar title={header} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <ThemedText type="subtitle">{text.titulo}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Última actualización: {text.actualizado}
          </ThemedText>
        </View>

        {text.secciones.map((seccion) => (
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
            {seccion.enlaces?.map((enlace) => (
              <Pressable key={enlace.url} accessibilityRole="link" hitSlop={4} onPress={() => openBrowserAsync(enlace.url)}>
                <ThemedText type="small" style={{ color: theme.primary }}>
                  {enlace.texto} ↗
                </ThemedText>
              </Pressable>
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
  },
  content: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  intro: {
    gap: Spacing.one,
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
