import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const theme = Colors.light;

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.primary,
    background: theme.background,
    card: theme.backgroundElement,
    text: theme.text,
    border: theme.border,
  },
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="nivel/[nivel]" />
        <Stack.Screen name="sena/[id]" />
        <Stack.Screen
          name="practica/[id]"
          options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: theme.cameraSurface } }}
        />
      </Stack>
    </ThemeProvider>
  );
}
