import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppBar } from "@/components/app-bar";
import { AppVersion } from "@/components/app-version";
import { Icon } from "@/components/icon";
import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, Radius, Spacing } from "@/constants/theme";
import { getSenasByNivel, NIVELES, SENAS } from "@/data/senas";
import { useTheme } from "@/hooks/use-theme";
import { useCompletedSigns } from "@/services/progress";

/** Signs approved in practice, per level. Every level card leads to that level. */
export default function ProgresoScreen() {
  const theme = useTheme();
  const completed = useCompletedSigns();

  const total = SENAS.filter((sena) => completed.has(sena.id)).length;

  const bar = (value: number) => (
    <View style={[styles.track, { backgroundColor: theme.primarySoft }]}>
      <View
        style={[
          styles.fill,
          { width: `${value * 100}%`, backgroundColor: theme.primary },
        ]}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppBar title="Tu progreso" showBack={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card]}>
          <View style={styles.row}>
            <ThemedText type="smallBold">Señas aprobadas</ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {total} de {SENAS.length}
            </ThemedText>
          </View>
          {bar(total / SENAS.length)}
        </View>

        {NIVELES.map((nivel) => {
          const senas = getSenasByNivel(nivel.id);
          const done = senas.filter((sena) => completed.has(sena.id)).length;

          return (
            <Pressable
              key={nivel.id}
              accessibilityRole="button"
              accessibilityLabel={`Ir al nivel ${nivel.id}, ${nivel.titulo}. ${done} de ${senas.length} señas aprobadas`}
              onPress={() =>
                router.push({
                  pathname: "/nivel/[nivel]",
                  params: { nivel: nivel.id },
                })
              }
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: pressed
                    ? theme.primaryTint
                    : theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.row}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">Nivel {nivel.id}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {nivel.titulo}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  {done}/{senas.length}
                </ThemedText>
                <Icon
                  name={{
                    ios: "chevron.right",
                    android: "chevron_right",
                    web: "chevron_right",
                  }}
                  size={16}
                  color={theme.textSecondary}
                />
              </View>

              {bar(done / senas.length)}
            </Pressable>
          );
        })}

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
    padding: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.three,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: Radius.pill,
  },
});
