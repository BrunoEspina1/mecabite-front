import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  /** `overlay` is for buttons drawn over the camera: a see-through dark pill, so the label never gets lost. */
  variant?: 'primary' | 'text' | 'overlay';
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isOverlay = variant === 'overlay';

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isPrimary && { backgroundColor: pressed ? theme.primaryPressed : theme.primary },
        isOverlay && { backgroundColor: theme.cameraOverlay },
        !isPrimary && pressed && { opacity: 0.6 },
        style,
      ]}
      {...rest}>
      <ThemedText
        type={isPrimary ? 'smallBold' : 'small'}
        style={[styles.label, { color: isPrimary ? theme.textOnPrimary : isOverlay ? theme.cameraText : theme.text }]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
  },
});
