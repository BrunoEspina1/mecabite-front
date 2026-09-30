import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const HEAD = 96;
const SHOULDERS_WIDTH = 250;
const SHOULDERS_HEIGHT = 130;

/** Head-and-shoulders outline: the person must be visible from the torso up for the sign to be recognized. */
export function TorsoGuide() {
  const theme = useTheme();
  const color = { borderColor: theme.cameraText };

  return (
    <View style={styles.guide} pointerEvents="none">
      <View style={[styles.head, color]} />
      <View style={[styles.shoulders, color]} />
    </View>
  );
}

const styles = StyleSheet.create({
  guide: {
    alignItems: 'center',
    opacity: 0.7,
  },
  head: {
    width: HEAD,
    height: HEAD * 1.2,
    borderRadius: HEAD,
    borderWidth: 3,
    marginBottom: 10,
  },
  shoulders: {
    width: SHOULDERS_WIDTH,
    height: SHOULDERS_HEIGHT,
    borderTopLeftRadius: SHOULDERS_WIDTH / 2.5,
    borderTopRightRadius: SHOULDERS_WIDTH / 2.5,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
  },
});
