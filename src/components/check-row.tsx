import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { SymbolName } from '@/data/senas';
import { useTheme } from '@/hooks/use-theme';

type CheckRowProps = {
  label: string;
  detail?: string;
  /** Custom icon; when omitted the row renders a check that reflects `done`. */
  icon?: SymbolName;
  done?: boolean;
  color?: string;
};

export function CheckRow({ label, detail, icon, done = false, color }: CheckRowProps) {
  const theme = useTheme();
  const textColor = color ?? theme.text;

  const name: SymbolName =
    icon ??
    (done
      ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
      : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' });
  const iconColor = icon ? theme.primary : done ? theme.success : textColor;

  return (
    <View style={styles.row}>
      <Icon name={name} size={24} color={iconColor} />
      <View style={styles.texts}>
        <ThemedText type="small" style={{ color: textColor }}>
          {label}
        </ThemedText>
        {detail ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.detail}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
  },
});
