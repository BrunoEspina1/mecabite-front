import { useLocalSearchParams } from 'expo-router';

import { PracticeLive } from '@/components/practice/practice-live';
import { PracticeSimulated } from '@/components/practice/practice-simulated';
import { getSena } from '@/data/senas';
import { isHandLandmarkerAvailable } from '@/modules/hand-landmarker';

/** 4. Modo práctica (en tiempo real). MediaPipe is iOS-only for now. */
export default function PracticaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sena = getSena(id);

  return isHandLandmarkerAvailable ? <PracticeLive sena={sena} /> : <PracticeSimulated sena={sena} />;
}
