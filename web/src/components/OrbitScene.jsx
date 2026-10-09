import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, CameraControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import { MathUtils, SRGBColorSpace } from 'three';
import { HERO_HOLD_MS, HERO_SWAP_SMOOTH_TIME, HERO_SLOT_ANGLE, initialCarousel, nextCarousel } from '../carousel.js';

function HeroBillboard({ hero, position, onReady, onRetired }) {
  const mesh = useRef(null);
  const texture = useTexture(hero.image);
  // Transparent cutouts cannot occlude the rear buffer reliably. Hide it
  // explicitly, fading continuously with the camera angle during each swap.
  useFrame(({ camera }) => {
    if (!mesh.current) return;
    const depth = (position[0] * camera.position.x + position[2] * camera.position.z)
      / (Math.hypot(position[0], position[2]) * Math.hypot(camera.position.x, camera.position.z));
    const opacity = MathUtils.smoothstep(depth, -0.8, -0.45);
    mesh.current.visible = opacity > 0;
    mesh.current.material.opacity = opacity;
  });
  texture.colorSpace = SRGBColorSpace;
  useEffect(() => {
    onReady(hero.image);
    return () => {
      onRetired(hero.image);
      texture.dispose();
      useTexture.clear(hero.image);
    };
  }, [hero.image, texture, onReady, onRetired]);
  return <Billboard position={position} follow>
    <mesh ref={mesh}>
      <planeGeometry args={[4.1, 4.1]} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.04} roughness={1} metalness={0} />
    </mesh>
  </Billboard>;
}

function HeroCards({ roster, initialIndex, running, nextRequest, onChange, onMoving }) {
  const invalidate = useThree((state) => state.invalidate);
  const controls = useRef(null);
  const ready = useRef(new Set());
  const moving = useRef(false);
  const mounted = useRef(false);
  const [frame, setFrame] = useState(() => initialCarousel(roster, initialIndex));
  const current = useRef(frame);
  current.current = frame;
  const onReady = useCallback((image) => ready.current.add(image), []);
  const onRetired = useCallback((image) => ready.current.delete(image), []);
  const lastRequest = useRef(nextRequest);
  const attachControls = useCallback((instance) => {
    controls.current = instance;
    instance?.rotateTo(-current.current.step * HERO_SLOT_ANGLE, Math.PI / 2, false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onMoving(false); };
  }, [onMoving]);

  const advance = useCallback(async () => {
    if (!controls.current || moving.current) return false;
    const updated = nextCarousel(current.current, roster);
    // The hidden buffer must finish loading before it can rotate into view.
    if (Object.values(current.current.slots).some((hero) => !ready.current.has(hero.image))) return false;
    moving.current = true;
    onMoving(true);
    const azimuth = -updated.step * HERO_SLOT_ANGLE;
    // Wake the demand renderer BEFORE starting the library tween. Otherwise
    // the first frame includes the entire idle delta and visibly jumps.
    // This is R3F's documented demand-render animation synchronization recipe.
    invalidate();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (!mounted.current) return false;
    await controls.current.rotateTo(azimuth, Math.PI / 2, true);
    if (!mounted.current) return false;
    // Snap the imperceptible damping tail so each picture is genuinely still.
    controls.current.rotateTo(azimuth, Math.PI / 2, false);
    current.current = updated;
    setFrame(updated);
    onChange(updated.step % roster.length);
    moving.current = false;
    onMoving(false);
    return true;
  }, [roster, onChange, onMoving, invalidate]);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let timer;
    const swap = async () => {
      if (cancelled) return;
      const advanced = await advance();
      // Slow networks get another chance; never rotate to an unloaded picture.
      if (!advanced && !cancelled) timer = setTimeout(swap, 250);
    };
    timer = setTimeout(swap, HERO_HOLD_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [running, frame.step, advance]);

  useEffect(() => {
    if (lastRequest.current === nextRequest) return;
    lastRequest.current = nextRequest;
    void advance();
  }, [nextRequest, advance]);

  return <>
    {Object.keys(frame.slots).map((slot) => {
      const angle = 0.32 - Number(slot) * HERO_SLOT_ANGLE;
      const hero = frame.slots[slot];
      return <Suspense key={slot} fallback={null}>
        <HeroBillboard key={hero.id} hero={hero} position={[Math.sin(angle) * 1.78, 0, Math.cos(angle) * 1.78]} onReady={onReady} onRetired={onRetired} />
      </Suspense>;
    })}
    <CameraControls
      ref={attachControls}
      makeDefault
      smoothTime={HERO_SWAP_SMOOTH_TIME}
      restThreshold={0.001}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
      mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }}
      touches={{ one: 0, two: 0, three: 0 }}
    />
  </>;
}

export default function OrbitScene({ roster, initialIndex, running, nextRequest, onChange, onMoving, onUnavailable }) {
  const startAngle = useRef(-initialIndex * HERO_SLOT_ANGLE).current;
  return <Canvas
    dpr={[1, 1.5]}
    frameloop="demand"
    gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }}
    fallback={<span>3D preview needs WebGL. The game still works without it.</span>}
    onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', () => {
      // R3F deliberately loses its context when reduced motion unmounts Canvas.
      // Only an unexpected loss on a still-mounted canvas is a device failure.
      if (gl.domElement.isConnected) onUnavailable();
    }, { once: true })}
  >
    <PerspectiveCamera makeDefault position={[Math.sin(startAngle) * 8, 0, Math.cos(startAngle) * 8]} fov={40}>
      <pointLight position={[0, 1.5, 0]} intensity={180} distance={8.3} decay={2} />
    </PerspectiveCamera>
    <ambientLight intensity={0.004} />
    <HeroCards roster={roster} initialIndex={initialIndex} running={running} nextRequest={nextRequest} onChange={onChange} onMoving={onMoving} />
  </Canvas>;
}
