import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { PanResponder, Platform, StyleSheet, View, type ViewProps } from 'react-native';
import * as THREE from 'three';

import { HandModel, SCALE, toScene, Trail } from '@/components/hand-3d/hand-mesh';
import { ThemedText } from '@/components/themed-text';
import { HandColors } from '@/constants/theme';
import type { HandFrame, SignAnimation } from '@/data/sign-animations';

export type HandView = 'front' | 'side';

/** Camera azimuth per preset. The dataset's profile camera sits 45° to the signer's right. */
const AZIMUTH: Record<HandView, number> = { front: 0, side: THREE.MathUtils.degToRad(-45) };
const ELEVATION = THREE.MathUtils.degToRad(6);
const HOLD_START_MS = 500;
const HOLD_END_MS = 900;
const FOV = 28;

type HandSceneProps = ViewProps & {
  animation: SignAnimation;
  view: HandView;
  playing: boolean;
  speed: number;
  background: string;
};

function lerpFrame(a: HandFrame, b: HandFrame, t: number): HandFrame {
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t, p[2] + (b[i][2] - p[2]) * t]);
}

/**
 * Creates a three.js renderer on an expo-gl context.
 *
 * expo-gl 57 makes its `WebGL2RenderingContext` extend `WebGLRenderingContext`, so three.js
 * (r163+, which rejects `context instanceof WebGLRenderingContext` as WebGL 1) refuses a real
 * WebGL 2 context. On native, hide the WebGL 1 constructor only while the renderer is created.
 * Returns null when the device really has no WebGL 2 (OpenGL ES 3).
 */
function createRenderer(gl: ExpoWebGLRenderingContext, canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  const options = { canvas, context: gl as unknown as WebGL2RenderingContext, antialias: true };
  if (Platform.OS === 'web') return new THREE.WebGLRenderer(options);

  if ((gl as unknown as { supportsWebGL2?: boolean }).supportsWebGL2 === false) return null;
  const globals = globalThis as { WebGLRenderingContext?: unknown };
  const webgl1 = globals.WebGLRenderingContext;
  globals.WebGLRenderingContext = undefined;
  try {
    return new THREE.WebGLRenderer(options);
  } finally {
    globals.WebGLRenderingContext = webgl1;
  }
}

/** Mutable playback/orbit state shared by React (props, gestures) and the render loop. */
class SceneControls {
  playing = true;
  speed = 1;
  dragAz = 0;
  dragEl = 0;
  private startAz = 0;
  private startEl = 0;

  readonly pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
    onPanResponderGrant: () => {
      this.startAz = this.dragAz;
      this.startEl = this.dragEl;
    },
    onPanResponderMove: (_, g) => {
      this.dragAz = this.startAz - g.dx * 0.008;
      this.dragEl = THREE.MathUtils.clamp(this.startEl + g.dy * 0.006, -0.9, 0.9);
    },
  });

  constructor(public view: HandView) {}

  setPlayback(playing: boolean, speed: number) {
    this.playing = playing;
    this.speed = speed;
  }

  setView(view: HandView) {
    this.view = view;
    this.dragAz = 0;
    this.dragEl = 0;
  }

  private cleanup: (() => void) | null = null;

  /** Registers how to tear down the GL scene (called on unmount). */
  onDispose(cleanup: () => void) {
    this.cleanup = cleanup;
  }

  dispose() {
    this.cleanup?.();
    this.cleanup = null;
  }
}

/**
 * three.js scene on an expo-gl GLView. Rendering and timing live outside React
 * (SceneControls + a requestAnimationFrame loop), so React never re-renders per frame.
 */
export function HandScene({ animation, view, playing, speed, background, style, ...rest }: HandSceneProps) {
  const focused = useIsFocused();
  const [controls] = useState(() => new SceneControls(view));
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => controls.setPlayback(playing && focused, speed), [controls, playing, focused, speed]);
  useEffect(() => controls.setView(view), [controls, view]);
  useEffect(() => () => controls.dispose(), [controls]);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    // three.js expects a canvas; expo-gl only gives the context.
    const canvas = {
      width,
      height,
      style: {},
      clientWidth: width,
      clientHeight: height,
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => gl,
    } as unknown as HTMLCanvasElement;
    const renderer = createRenderer(gl, canvas);
    if (!renderer) {
      setUnsupported(true);
      return;
    }
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    renderer.setClearColor(new THREE.Color(background), 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(HandColors.lightSky, HandColors.lightGround, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff1e6, 0.5);
    fill.position.set(-3, 1, 2);
    scene.add(fill);

    const hand = new HandModel(animation.palmar);
    scene.add(hand.group);

    const { frames, fps, trail: trailIndex } = animation;
    const trail = trailIndex === null ? null : new Trail(frames.map((f) => toScene(f[trailIndex])));
    if (trail) scene.add(trail.group);

    // Frame the whole movement.
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    frames.forEach((f) => f.forEach((p) => box.expandByPoint(toScene(p, v))));
    box.expandByScalar(0.03 * SCALE);
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const distance = (radius / Math.sin(THREE.MathUtils.degToRad(FOV / 2))) * 0.82;

    const camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 100);
    let az = AZIMUTH[controls.view];
    let el = ELEVATION;

    const moveMs = ((frames.length - 1) / fps) * 1000;
    const cycle = HOLD_START_MS + moveMs + HOLD_END_MS;
    let elapsed = 0;
    let last = 0;
    let raf = 0;
    let alive = true;

    const render = (now: number) => {
      if (!alive) return;
      const dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      const c = controls;
      if (c.playing) elapsed += dt * c.speed;

      const t = elapsed % cycle;
      const position = (Math.min(Math.max(t - HOLD_START_MS, 0), moveMs) / 1000) * fps;
      const i = Math.min(Math.floor(position), frames.length - 1);
      hand.update(lerpFrame(frames[i], frames[Math.min(i + 1, frames.length - 1)], position - i));
      trail?.setProgress(position / Math.max(1, frames.length - 1));

      // Ease the camera towards the preset + the user's drag.
      const k = 1 - Math.exp(-dt / 140);
      az += (AZIMUTH[c.view] + c.dragAz - az) * k;
      el += (ELEVATION + c.dragEl - el) * k;
      camera.position.set(
        center.x + distance * Math.sin(az) * Math.cos(el),
        center.y + distance * Math.sin(el),
        center.z + distance * Math.cos(az) * Math.cos(el),
      );
      camera.lookAt(center);

      renderer.render(scene, camera);
      gl.endFrameEXP();
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    controls.onDispose(() => {
      alive = false;
      cancelAnimationFrame(raf);
      hand.dispose();
      trail?.dispose();
      renderer.dispose();
    });
  };

  if (unsupported) {
    return (
      <View style={[styles.container, styles.center, style]} {...rest}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          Este dispositivo no soporta la vista 3D (WebGL 2).
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} {...controls.pan.panHandlers} {...rest}>
      <GLView style={StyleSheet.absoluteFill} msaaSamples={4} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
