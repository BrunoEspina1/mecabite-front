/**
 * Design tokens for EnSeñas.
 * Change colors ONLY in `Palette`; screens consume the semantic tokens in `Colors`.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Raw palette (Hult Prize – cálida). */
export const Palette = {
  rose: '#E91E63',
  roseDark: '#C2185B',
  pink: '#F06292',
  blush: '#F8BBD0',
  blushLight: '#FDE7EF',
  coral: '#FF6B6B',
  orange: '#FFA726',
  cream: '#FFF7F0',
  white: '#FFFFFF',
  ink: '#1F1F24',
  gray: '#6B6B75',
  grayLight: '#E9E3DE',
  dark: '#141418',
  green: '#4CAF50',
  greenDark: '#2E7D32',
  greenSoft: '#E6F4E7',
  red: '#E53935',
  redSoft: '#FDECEA',
  // Dark theme
  night: '#141418',
  nightRaised: '#1F1F24',
  nightLine: '#34343D',
  paper: '#F4F1EE',
  ash: '#A9A6AE',
  wine: '#5A2038',
  wineDeep: '#2A1720',
  wineSelected: '#4A1F31',
  greenLight: '#81C784',
  greenNight: '#1E3A22',
  redLight: '#EF5350',
  redNight: '#3A1B1B',
} as const;

export type ThemeColor =
  | 'text'
  | 'textSecondary'
  | 'textOnPrimary'
  | 'background'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'primary'
  | 'primaryPressed'
  | 'primarySoft'
  | 'primaryTint'
  | 'accent'
  | 'accentSecondary'
  | 'border'
  | 'success'
  | 'successStrong'
  | 'successSoft'
  | 'danger'
  | 'dangerSoft'
  | 'cameraSurface'
  | 'cameraOverlay'
  | 'cameraText';

/** Semantic tokens per theme. The camera screens look the same in both. */
export const Colors: Record<'light' | 'dark', Record<ThemeColor, string>> = {
  light: {
    text: Palette.ink,
    textSecondary: Palette.gray,
    textOnPrimary: Palette.white,
    background: Palette.cream,
    backgroundElement: Palette.white,
    backgroundSelected: Palette.blush,
    primary: Palette.rose,
    primaryPressed: Palette.roseDark,
    primarySoft: Palette.blush,
    primaryTint: Palette.blushLight,
    accent: Palette.coral,
    accentSecondary: Palette.orange,
    border: Palette.grayLight,
    success: Palette.green,
    successStrong: Palette.greenDark,
    successSoft: Palette.greenSoft,
    danger: Palette.red,
    dangerSoft: Palette.redSoft,
    cameraSurface: Palette.dark,
    cameraOverlay: 'rgba(20, 20, 24, 0.55)',
    cameraText: Palette.white,
  },
  dark: {
    text: Palette.paper,
    textSecondary: Palette.ash,
    textOnPrimary: Palette.white,
    background: Palette.night,
    backgroundElement: Palette.nightRaised,
    backgroundSelected: Palette.wineSelected,
    primary: Palette.rose,
    primaryPressed: Palette.roseDark,
    primarySoft: Palette.wine,
    primaryTint: Palette.wineDeep,
    accent: Palette.coral,
    accentSecondary: Palette.orange,
    border: Palette.nightLine,
    success: Palette.green,
    successStrong: Palette.greenLight,
    successSoft: Palette.greenNight,
    danger: Palette.redLight,
    dangerSoft: Palette.redNight,
    cameraSurface: Palette.dark,
    cameraOverlay: 'rgba(20, 20, 24, 0.55)',
    cameraText: Palette.white,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
