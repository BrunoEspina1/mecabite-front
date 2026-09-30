import { StyleSheet, View } from 'react-native';

import type { LandmarksEvent } from '@/modules/hand-landmarker';
import { useTheme } from '@/hooks/use-theme';

type LandmarksOverlayProps = {
  frame: LandmarksEvent | null;
  width: number;
  height: number;
};

/**
 * Draws the detected hand and upper-body landmarks over the camera preview. The preview uses aspect-fill,
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
      {frame.poseLandmarks?.slice(0, UPPER_BODY).map(([x, y, , visibility], i) =>
        visibility < MIN_VISIBILITY ? null : (
          <View
            key={`pose-${i}`}
            style={[
              styles.poseDot,
              {
                left: offsetX + x * frame.imageWidth * scale - POSE_DOT / 2,
                top: offsetY + y * frame.imageHeight * scale - POSE_DOT / 2,
                backgroundColor: theme.accentSecondary,
              },
            ]}
          />
        ),
      )}
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
const POSE_DOT = 8;
/** Face, shoulders, arms and hips; legs are not drawn. */
const UPPER_BODY = 25;
/** Same threshold the backend uses to consider a body point visible. */
const MIN_VISIBILITY = 0.5;

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
  },
  poseDot: {
    position: 'absolute',
    width: POSE_DOT,
    height: POSE_DOT,
    borderRadius: POSE_DOT / 2,
  },
});
