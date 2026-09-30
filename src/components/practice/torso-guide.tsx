import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type TorsoGuideProps = {
  /** Space the guide may use; it takes most of the height and stays centred in it. */
  width: number;
  height: number;
};

const LINE = 3;

/**
 * Head, shoulders and torso outline: where to stand so the camera sees you from the torso up.
 * It scales with the space it is given instead of having a fixed size.
 */
export function TorsoGuide({ width, height }: TorsoGuideProps) {
  const theme = useTheme();
  if (width <= 0 || height <= 0) return null;

  const color = { borderColor: theme.cameraText };
  // The whole figure: most of the height, never wider than the space.
  const figure = Math.min(height * 0.9, (width - 16) / 0.8);
  const head = figure * 0.26;
  const gap = figure * 0.03;
  const torsoWidth = figure * 0.8;
  const torsoHeight = figure - head * 1.2 - gap;

  return (
    <View style={styles.guide} pointerEvents="none">
      <View style={[styles.head, color, { width: head, height: head * 1.2, borderRadius: head, marginBottom: gap }]} />
      <View
        style={[
          styles.torso,
          color,
          { width: torsoWidth, height: torsoHeight, borderTopLeftRadius: torsoWidth / 2.5, borderTopRightRadius: torsoWidth / 2.5 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  guide: {
    alignItems: 'center',
    opacity: 0.7,
  },
  head: {
    borderWidth: LINE,
  },
  // Open at the bottom: the body goes on below the picture.
  torso: {
    borderTopWidth: LINE,
    borderLeftWidth: LINE,
    borderRightWidth: LINE,
  },
});
