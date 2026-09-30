import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { useTourStep } from '@/onboarding/tour';

export default function TabsLayout() {
  const theme = useTheme();
  // The tour runs on Inicio: switching tabs mid-tour would strand it.
  const touring = useTourStep() !== null;

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      tintColor={theme.primary}
      indicatorColor={theme.primarySoft}
      iconColor={{ default: theme.textSecondary, selected: theme.primary }}
      labelStyle={{ default: { color: theme.textSecondary }, selected: { color: theme.primary } }}>
      <NativeTabs.Trigger name="inicio">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progreso" disabled={touring}>
        <NativeTabs.Trigger.Label>Progreso</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ajustes" disabled={touring}>
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
