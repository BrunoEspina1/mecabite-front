import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppBar } from "@/components/app-bar";
import { AppVersion } from "@/components/app-version";
import { LevelCard } from "@/components/level-card";
import { ThemedText } from "@/components/themed-text";
import { TourOverlay } from "@/components/tour/tour-overlay";
import { TourTarget } from "@/components/tour/tour-target";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { NIVELES } from "@/data/senas";
import { useTheme } from "@/hooks/use-theme";
import { completeTourAction } from "@/onboarding/tour";

/** 2. Selección de niveles */
export default function NivelesScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <AppBar title="Inicio" showBack={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">¿Qué aprenderás hoy?</ThemedText>

        <TourTarget id="levels" style={styles.list}>
          {NIVELES.map((nivel) => {
            const card = (
              <LevelCard
                key={nivel.id}
                nivel={nivel}
                onPress={() => {
                  if (nivel.id === "1") completeTourAction("level-1");
                  router.push({
                    pathname: "/nivel/[nivel]",
                    params: { nivel: nivel.id },
                  });
                }}
              />
            );
            return nivel.id === "1" ? (
              <TourTarget key={nivel.id} id="level-1">
                {card}
              </TourTarget>
            ) : (
              card
            );
          })}
        </TourTarget>
        <AppVersion />
      </ScrollView>
      <TourOverlay screen="inicio" />
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
    gap: Spacing.four,
  },
  list: {
    gap: Spacing.three,
  },
});
