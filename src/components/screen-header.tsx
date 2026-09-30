import { router } from 'expo-router';
import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ScreenHeaderProps = ViewProps & {
  title?: string;
  right?: React.ReactNode;
  color?: string;
  showBack?: boolean;
};

export function ScreenHeader({ title, right, color, showBack = true, style, ...rest }: ScreenHeaderProps) {
  return (
    <View style={[styles.row, style]} {...rest}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Regresar"
          hitSlop={12}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Icon name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} color={color} />
        </Pressable>
      ) : null}
      <ThemedText type="smallBold" style={[styles.title, color ? { color } : null]} numberOfLines={1}>
        {title}
      </ThemedText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
  },
  title: {
    flex: 1,
    fontSize: 17,
  },
});
