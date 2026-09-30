import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useTourStep } from '@/onboarding/tour';

SplashScreen.preventAutoHideAsync();

if (__DEV__) {
  // React Native core (RCTEventEmitter) logs this when a native-driven screen transition sends a value
  // after JS stopped listening (screen unmounted or app reloading). It's harmless; hide only this one.
  const warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('`onAnimatedValueUpdate` with no listeners registered')) return;
    warn(...args);
  };
}

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
  // Swiping back mid-tour would skip the step the person is on.
  const touring = useTourStep() !== null;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{ headerShown: false, gestureEnabled: !touring, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="nivel/[nivel]" />
        <Stack.Screen name="sena/[id]" />
        <Stack.Screen name="conexion" />
        <Stack.Screen name="privacidad" />
        <Stack.Screen name="terminos" />
        <Stack.Screen
          name="practica/[id]"
          options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: theme.cameraSurface } }}
        />
      </Stack>
    </ThemeProvider>
  );
}
