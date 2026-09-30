import { StyleSheet, View } from 'react-native';

import type { LandmarksEvent } from '@/modules/hand-landmarker';
import { useTheme } from '@/hooks/use-theme';

type LandmarksOverlayProps = {
  frame: LandmarksEvent | null;
  width: number;
  height: number;
};

/**
 * Draws the detected landmarks over the camera preview. The preview uses aspect-fill,
 * so normalized image coords are scaled by the larger ratio and centered.
 */
export function LandmarksOverlay({ frame, width, height }: LandmarksOverlayProps) {
  const theme = useTheme();
  if (!frame || !frame.imageWidth || !width) return null;

  const scale = Math.max(width / frame.imageWidth, height / frame.imageHeight);
  const offsetX = (width - frame.imageWidth * scale) / 2;
  const offsetY = (height - frame.imageHeight * scale) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {frame.hands.flatMap((hand, h) =>
        hand.landmarks.map(([x, y], i) => (
          <View
            key={`${h}-${i}`}
            style={[
              styles.dot,
              {
                left: offsetX + x * frame.imageWidth * scale - DOT / 2,
                top: offsetY + y * frame.imageHeight * scale - DOT / 2,
                backgroundColor: i % 4 === 0 ? theme.primary : theme.cameraText,
                borderColor: theme.primary,
              },
            ]}
          />
        )),
      )}
    </View>
  );
}

const DOT = 10;

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
  },
});
