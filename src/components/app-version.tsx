import Constants from 'expo-constants';
import { StyleSheet, type TextProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';

/** "SeñaFácil v1.0.0": the version comes from `version` in app.json. */
export function AppVersion({ style, ...rest }: TextProps) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={[styles.text, style]} {...rest}>
      SeñaFácil v{Constants.expoConfig?.version ?? '–'}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});
