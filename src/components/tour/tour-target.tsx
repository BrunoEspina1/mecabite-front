import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { setTargetRect, useTourStep, type TourTargetId } from '@/onboarding/tour';

type TourTargetProps = {
  id: TourTargetId;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Marks an element the tour can highlight. Measures its window position while its step is active. */
export function TourTarget({ id, children, style }: TourTargetProps) {
  const ref = useRef<View>(null);
  const active = useTourStep()?.step.target === id;

  const measure = useCallback(() => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) setTargetRect(id, { x, y, width, height });
    });
  }, [id]);

  useEffect(() => {
    if (!active) return;
    // Measure again after screen transitions and scrolls settle.
    const timers = [50, 400, 800].map((delay) => setTimeout(measure, delay));
    return () => timers.forEach(clearTimeout);
  }, [active, measure]);

  return (
    <View ref={ref} collapsable={false} style={style} onLayout={active ? measure : undefined}>
      {children}
    </View>
  );
}
