import { Colors } from '@/constants/theme';

/** Only the light theme exists for now; add a dark variant in `Colors` to support it. */
export function useTheme() {
  return Colors.light;
}
