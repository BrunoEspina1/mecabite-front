import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconProps = {
  name: SymbolViewProps['name'];
  size?: number;
  color?: string;
};

/** Cross-platform icon: SF Symbols on iOS, Material Symbols on Android/web. */
export function Icon({ name, size = 24, color }: IconProps) {
  const theme = useTheme();
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color ?? theme.text}
      fallback={<Text style={{ fontSize: size * 0.8 }}>✋</Text>}
    />
  );
}
