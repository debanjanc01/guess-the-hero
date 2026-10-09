import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Billboard, OrbitControls, PerspectiveCamera, useTexture } from '@react-three/drei';
import { SRGBColorSpace } from 'three';

function HeroBillboard({ image, position }) {
  const texture = useTexture(image);
  texture.colorSpace = SRGBColorSpace;
  return <Billboard position={position} follow>
    <mesh>
      <planeGeometry args={[4.1, 4.1]} />
      <meshStandardMaterial map={texture} transparent alphaTest={0.04} roughness={1} metalness={0} />
    </mesh>
  </Billboard>;
}

export default function OrbitScene({ images, running, onUnavailable }) {
  return <Canvas
    dpr={[1, 1.5]}
    frameloop={running ? 'always' : 'demand'}
    gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }}
    fallback={<span>3D preview needs WebGL. The game still works without it.</span>}
    onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onUnavailable, { once: true })}
  >
    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={40}>
      {/* Camera-mounted light makes the near hero bright and the distant one a shadow.
          Three.js handles light falloff; there is no custom shader or animation engine. */}
      <pointLight position={[0, 1.5, 0]} intensity={180} distance={9.5} decay={2} />
    </PerspectiveCamera>
    <ambientLight intensity={0.004} />
    <Suspense fallback={null}>
      <HeroBillboard image={images[0]} position={[0.65, 0, 1.65]} />
      <HeroBillboard image={images[1]} position={[-0.65, 0, -1.65]} />
    </Suspense>
    <OrbitControls
      makeDefault
      autoRotate={running}
      autoRotateSpeed={2.4}
      enableDamping
      dampingFactor={0.08}
      enableZoom={false}
      enablePan={false}
      enableRotate={running}
      minPolarAngle={Math.PI / 2}
      maxPolarAngle={Math.PI / 2}
      target={[0, 0, 0]}
    />
  </Canvas>;
}

