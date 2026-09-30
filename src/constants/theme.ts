/**
 * Design tokens for SeñaFácil.
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
  coral: '#FF6B6B',
  orange: '#FFA726',
  cream: '#FFF7F0',
  white: '#FFFFFF',
  ink: '#1F1F24',
  gray: '#6B6B75',
  grayLight: '#E9E3DE',
  dark: '#141418',
  green: '#4CAF50',
} as const;

/** Semantic tokens. Only light mode for now. */
export const Colors = {
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
    accent: Palette.coral,
    accentSecondary: Palette.orange,
    border: Palette.grayLight,
    success: Palette.green,
    cameraSurface: Palette.dark,
    cameraOverlay: 'rgba(20, 20, 24, 0.55)',
    cameraText: Palette.white,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

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
