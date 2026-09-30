/**
 * Guided tour of the app flow: levels → level → sign → practice.
 * Each step lives on one screen; "action" steps wait for the person to tap the highlighted element
 * (the screen calls `completeTourAction`), the rest move on with "Siguiente".
 */

import { useSyncExternalStore } from 'react';

import { Radius } from '@/constants/theme';
import { kv } from '@/services/api/storage';

export type TourScreen = 'inicio' | 'nivel' | 'sena' | 'practica';

export type TourTargetId =
  | 'levels'
  | 'level-1'
  | 'level-tabs'
  | 'first-sign'
  | 'sign-video'
  | 'sign-indications'
  | 'sign-start'
  | 'practice-framing'
  | 'practice-status';

export type TourStep = {
  id: string;
  screen: TourScreen;
  title: string;
  text: string;
  /** Element to highlight; without it the card shows centered. */
  target?: TourTargetId;
  /** Corner radius of the highlighted element, so the cutout follows its shape. */
  radius?: number;
  /** The person must tap the target to continue. */
  action?: boolean;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    screen: 'inicio',
    title: '¡Bienvenido a EnSeñas!',
    text: 'Aprende señas practicando frente a la cámara. Te mostramos cómo.',
  },
  {
    id: 'levels',
    screen: 'inicio',
    target: 'levels',
    radius: Radius.lg,
    title: 'Tres niveles',
    text: 'Letras estáticas, letras con movimiento y palabras.',
  },
  {
    id: 'open-level',
    screen: 'inicio',
    target: 'level-1',
    radius: Radius.lg,
    action: true,
    title: 'Entra a un nivel',
    text: 'Toca el Nivel 1.',
  },
  {
    id: 'level-tabs',
    screen: 'nivel',
    target: 'level-tabs',
    radius: Radius.pill,
    title: 'Cambia de nivel',
    text: 'Aquí pasas de un nivel a otro.',
  },
  {
    id: 'open-sign',
    screen: 'nivel',
    target: 'first-sign',
    action: true,
    title: 'Elige una seña',
    text: 'Toca la primera.',
  },
  {
    id: 'video',
    screen: 'sena',
    target: 'sign-video',
    radius: Radius.lg,
    title: 'Mira el video',
    text: 'Observa cómo se hace la seña.',
  },
  {
    id: 'indications',
    screen: 'sena',
    target: 'sign-indications',
    title: 'Lee las indicaciones',
    text: 'Es lo que la app va a revisar.',
  },
  {
    id: 'start-practice',
    screen: 'sena',
    target: 'sign-start',
    radius: Radius.pill,
    action: true,
    title: 'Practica',
    text: 'Toca "Comenzar práctica".',
  },
  {
    id: 'framing',
    screen: 'practica',
    target: 'practice-framing',
    title: 'Encuádrate',
    text: 'Colócate del torso para arriba, como la silueta.',
  },
  {
    id: 'status',
    screen: 'practica',
    target: 'practice-status',
    title: 'Tu resultado',
    text: 'En rojo lo que falla. Hazla bien 3 veces para aprobar.',
  },
  {
    id: 'done',
    screen: 'practica',
    title: '¡Listo!',
    text: 'Puedes repetir el tutorial desde Ajustes.',
  },
];

const SCREEN_ORDER: TourScreen[] = ['inicio', 'nivel', 'sena', 'practica'];

const DONE_KEY = 'onboarding-done';

type TourState = { index: number | null };

function initial(): TourState {
  try {
    return { index: kv.get(DONE_KEY) === '1' ? null : 0 };
  } catch {
    return { index: 0 };
  }
}

let state = initial();
const listeners = new Set<() => void>();

function set(next: TourState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function finish() {
  kv.set(DONE_KEY, '1');
  set({ index: null });
}

export function nextTourStep() {
  if (state.index === null) return;
  const next = state.index + 1;
  if (next >= TOUR_STEPS.length) finish();
  else set({ index: next });
}

export function skipTour() {
  finish();
}

export function restartTour() {
  set({ index: 0 });
}

/**
 * Call when a screen gets focus. If the tour is already on a later screen (the person went back),
 * it returns to this screen's last step, the one that leads forward again.
 */
export function syncTourToScreen(screen: TourScreen) {
  if (state.index === null) return;
  const current = SCREEN_ORDER.indexOf(TOUR_STEPS[state.index].screen);
  if (current <= SCREEN_ORDER.indexOf(screen)) return;
  const last = TOUR_STEPS.findLastIndex((step) => step.screen === screen);
  if (last >= 0) set({ index: last });
}

/** Call from the highlighted element's onPress; moves on only if that element is the current action. */
export function completeTourAction(target: TourTargetId) {
  const step = state.index === null ? null : TOUR_STEPS[state.index];
  if (step?.action && step.target === target) nextTourStep();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current step, or null when the tour is over. */
export function useTourStep(): { step: TourStep; index: number } | null {
  const index = useSyncExternalStore(subscribe, () => state.index);
  return index === null ? null : { step: TOUR_STEPS[index], index };
}

// ─── Target positions ────────────────────────────────────────────────────────

export type TargetRect = { x: number; y: number; width: number; height: number };

const rects = new Map<TourTargetId, TargetRect>();
const rectListeners = new Set<() => void>();

export function setTargetRect(id: TourTargetId, rect: TargetRect) {
  const prev = rects.get(id);
  if (prev && prev.x === rect.x && prev.y === rect.y && prev.width === rect.width && prev.height === rect.height) return;
  rects.set(id, rect);
  rectListeners.forEach((listener) => listener());
}

/** Window position of a target, once it has been measured. */
export function useTargetRect(id: TourTargetId | undefined): TargetRect | null {
  return useSyncExternalStore(
    (listener) => {
      rectListeners.add(listener);
      return () => {
        rectListeners.delete(listener);
      };
    },
    () => (id ? (rects.get(id) ?? null) : null),
  );
}
