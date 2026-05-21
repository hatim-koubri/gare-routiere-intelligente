'use client';

import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, ContactShadows, Html, Center } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  type: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  maxWeight: number;
  isOverLimit: boolean;
}

const BASE_L = 1.6;
const BASE_H = 1.05;
const BASE_D = 0.65;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function SuitcaseModel({ weight, length: l, width: w, height: h, maxWeight, isOverLimit }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  const scaleL = clamp(l / 60, 0.7, 1.5);
  const scaleH = clamp(h / 40, 0.7, 1.5);
  const scaleD = clamp(w / 30, 0.6, 1.3);

  const dimL = BASE_L * scaleL;
  const dimH = BASE_H * scaleH;
  const dimD = BASE_D * scaleD;

  const weightRatio = weight / maxWeight;
  const isWarning = weightRatio >= 0.85 && !isOverLimit;

  const bodyColor = isOverLimit ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  const handleY = dimH / 2;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[dimL, dimH, dimD]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color={bodyColor}
          metalness={0.05}
          roughness={0.35}
          clearcoat={0.15}
          clearcoatRoughness={0.4}
          envMapIntensity={0.6}
        />
      </RoundedBox>

      <mesh position={[0, 0, dimD / 2 + 0.001]}>
        <planeGeometry args={[dimL * 0.85, dimH * 0.85]} />
        <meshBasicMaterial color="white" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      <mesh position={[0, dimH * 0.1, dimD / 2 + 0.002]}>
        <planeGeometry args={[dimL * 0.6, 0.008]} />
        <meshBasicMaterial color="black" transparent opacity={0.08} />
      </mesh>
      <mesh position={[0, -dimH * 0.05, dimD / 2 + 0.002]}>
        <planeGeometry args={[dimL * 0.6, 0.005]} />
        <meshBasicMaterial color="black" transparent opacity={0.05} />
      </mesh>

      <mesh position={[0, 0, dimD / 2 + 0.003]}>
        <planeGeometry args={[dimL * 0.7, 0.015]} />
        <meshBasicMaterial color="black" transparent opacity={0.15} />
      </mesh>

      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={'zt-' + i} position={[-dimL * 0.32 + (i / 14) * dimL * 0.64, 0, dimD / 2 + 0.004]}>
          <planeGeometry args={[0.015, 0.025]} />
          <meshBasicMaterial color="black" transparent opacity={0.1} />
        </mesh>
      ))}

      <group position={[0, handleY + 0.05, 0]}>
        <RoundedBox args={[0.45, 0.035, 0.08]} radius={0.015} smoothness={3}>
          <meshPhysicalMaterial color="#475569" metalness={0.4} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.041]}>
          <planeGeometry args={[0.35, 0.015]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        {[-0.2, 0.2].map(x => (
          <mesh key={'hs-' + x} position={[x, -0.012, 0]}>
            <boxGeometry args={[0.04, 0.025, 0.09]} />
            <meshPhysicalMaterial color="#475569" metalness={0.3} roughness={0.3} />
          </mesh>
        ))}
      </group>

      <group position={[0, handleY + 0.12, -dimD * 0.15]}>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.04, 0.32, 0.04]} />
          <meshPhysicalMaterial color="#94a3b8" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.06, 0.02, 0.06]} />
          <meshPhysicalMaterial color="#64748b" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {[-1, 1].map(sx =>
        [-1, 1].map(sz => (
          <group key={'wheel-' + sx + '-' + sz}>
            <mesh position={[sx * dimL * 0.38, -dimH / 2 - 0.03, sz * dimD * 0.4]}>
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshPhysicalMaterial color="#334155" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[sx * dimL * 0.38, -dimH / 2 - 0.03, sz * dimD * 0.4]}>
              <sphereGeometry args={[0.025, 12, 12]} />
              <meshPhysicalMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))
      )}

      {[-1, 1].map(sx =>
        [-1, 1].map(sz => (
          <mesh key={'foot-' + sx + '-' + sz} position={[sx * dimL * 0.25, -dimH / 2 + 0.005, sz * dimD * 0.3]}>
            <boxGeometry args={[0.025, 0.01, 0.025]} />
            <meshPhysicalMaterial color="#1e293b" metalness={0.3} roughness={0.6} />
          </mesh>
        ))
      )}
    </group>
  );
}

function WeightBubbleHtml({ weight, isOverLimit, isWarning }: { weight: number; isOverLimit: boolean; isWarning: boolean }) {
  return (
    <Html position={[0, 1.5, 0]} center>
      <motion.div
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 shadow-lg font-black text-xs whitespace-nowrap',
          isOverLimit
            ? 'bg-red-500/90 border-red-400/50 text-white'
            : isWarning
              ? 'bg-amber-400/90 border-amber-300/50 text-amber-900'
              : 'bg-emerald-400/90 border-emerald-300/50 text-emerald-900'
        )}
        animate={isOverLimit ? { x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 0] } : { y: [0, -3, 0] }}
        transition={isOverLimit ? { duration: 0.4, repeat: Infinity, repeatDelay: 1.5 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
        <span>{weight} kg</span>
      </motion.div>
    </Html>
  );
}

function DimensionLabelHtml({ length, width, height }: { length: number; width: number; height: number }) {
  return (
    <Html position={[0, -1.3, 0]} center>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-zinc-700 shadow-sm"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 whitespace-nowrap tracking-tight">
          {Math.round(length)}&times;{Math.round(width)}&times;{Math.round(height)} cm
        </span>
      </motion.div>
    </Html>
  );
}

export default function Baggage3DPreview(props: Props) {
  const scaleL = clamp(props.length / 60, 0.7, 1.5);
  const scaleH = clamp(props.height / 40, 0.7, 1.5);
  const scaleD = clamp(props.width / 30, 0.6, 1.3);
  const maxScale = Math.max(scaleL, scaleH, scaleD);
  const cw = 220 + maxScale * 60;
  const ch = 240 + maxScale * 50;

  return (
    <div className="mx-auto" style={{ position: 'relative', width: cw, height: ch }}>
      <Canvas
        camera={{ position: [2.2, 1.6, 2.5], fov: 32, near: 0.1, far: 10 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 2]} intensity={1.2} />
        <directionalLight position={[-2, 1, -1]} intensity={0.4} />
        <hemisphereLight args={['#b1e1ff', '#ffffff', 0.4]} />

        <Suspense fallback={null}>
          <Center>
            <SuitcaseModel {...props} />
          </Center>
          <ContactShadows
            position={[0, -0.9, 0]}
            opacity={0.35}
            scale={3.5}
            blur={2.5}
            far={2}
          />
          <WeightBubbleHtml weight={props.weight} isOverLimit={props.isOverLimit} isWarning={props.weight / props.maxWeight >= 0.85 && !props.isOverLimit} />
          <DimensionLabelHtml length={props.length} width={props.width} height={props.height} />
        </Suspense>
      </Canvas>
    </div>
  );
}
