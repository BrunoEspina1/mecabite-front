import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { NIVELES, type NivelId } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

type SegmentedLevelsProps = {
  value: NivelId;
  onChange: (id: NivelId) => void;
};

export function SegmentedLevels({ value, onChange }: SegmentedLevelsProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {NIVELES.map((nivel) => {
        const active = nivel.id === value;
        return (
          <Pressable
            key={nivel.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(nivel.id)}
            style={[
              styles.segment,
              { backgroundColor: active ? theme.primary : theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="smallBold" style={{ color: active ? theme.textOnPrimary : theme.textSecondary }}>
              Nivel {nivel.id}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
