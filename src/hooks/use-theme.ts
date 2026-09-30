import { Colors } from '@/constants/theme';
import { usePreferences } from '@/services/preferences';

/** Colours of the theme chosen in Ajustes (light unless the person switched to dark). */
export function useTheme() {
  return Colors[usePreferences().theme];
}
