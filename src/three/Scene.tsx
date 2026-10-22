import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useState } from 'react'
import { cameras, terreno } from '@/config/predio'
import { useStore } from '@/store/store'
import { Atmosphere } from './Atmosphere'
import { Building } from './Building'
import { CameraRig } from './CameraRig'
import { City } from './City'
import { Site } from './Site'

/** a câmera principal e a frente ficam livres de casas do entorno */
const CLEAR: [number, number][] = [cameras.inicio.pos, cameras.frente.pos].map((p) => [p[0], p[2]])

/** acabamento de imagem: sombra de contato, brilho das luzes, vinheta e tom de cinema */
function Effects({ low }: { low: boolean }) {
  const noite = useStore((s) => s.noite)
  return (
    <EffectComposer multisampling={low ? 0 : 4} enableNormalPass={false}>
      <N8AO aoRadius={1.6} distanceFalloff={0.8} intensity={low ? 1.6 : 2.4} quality={low ? 'performance' : 'medium'} halfRes={low} color="#0b1220" />
      <Bloom mipmapBlur intensity={noite ? 1.05 : 0.4} luminanceThreshold={0.95} luminanceSmoothing={0.22} radius={0.72} />
      <Vignette offset={0.3} darkness={noite ? 0.6 : 0.35} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export default function Scene() {
  // em aparelhos mais fracos a resolução cai sozinha para manter a animação fluida
  const [low, setLow] = useState(false)
  const [dpr, setDpr] = useState(1.6)

  return (
    <Canvas
      shadows="percentage"
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 34, near: 0.5, far: 12000, position: cameras.abertura.pos }}
      onPointerMissed={() => useStore.getState().focar(null)}
      onCreated={() => requestAnimationFrame(() => useStore.getState().set({ cenaCarregada: true }))}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1)
          setLow(true)
        }}
        onIncline={() => setDpr(1.6)}
      />
      <Atmosphere />
      <CameraRig />
      <City lot={terreno.lote} clear={CLEAR} />
      <Site />
      <Building />
      <Effects low={low} />
    </Canvas>
  )
}
