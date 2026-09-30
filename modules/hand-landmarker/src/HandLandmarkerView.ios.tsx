import { requireNativeView } from 'expo';

import type { HandLandmarkerViewProps } from './HandLandmarker.types';

const NativeView = requireNativeView<HandLandmarkerViewProps>('HandLandmarker');

export const isHandLandmarkerAvailable = true;

export function HandLandmarkerView(props: HandLandmarkerViewProps) {
  return <NativeView {...props} />;
}
