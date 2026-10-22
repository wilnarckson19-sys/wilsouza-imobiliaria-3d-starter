import { Environment, Lightformer, Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { INDICE, TOTAL_ANDARES, useStore } from '@/store/store'
import { STATUS_CODE, envTuned, fadeTuned, fx, nightTuned } from './materials'

// "noite" é a hora azul: céu azul profundo no alto, claro no horizonte
const NIGHT = {
  top: new THREE.Color('#1c3a62'),
  mid: new THREE.Color('#3a6d99'),
  horizon: new THREE.Color('#8fb3cf'),
  bottom: new THREE.Color('#22324a'),
  fog: new THREE.Color('#4f7398'),
  hemiSky: new THREE.Color('#7f9dc6'),
  hemiGround: new THREE.Color('#5b4a3a'),
  sun: new THREE.Color('#c3d2ea'),
}
const DAY = {
  top: new THREE.Color('#2f6fbf'),
  mid: new THREE.Color('#6e9fd4'),
  horizon: new THREE.Color('#cfe2f0'),
  bottom: new THREE.Color('#b3c3cc'),
  fog: new THREE.Color('#c7d8e4'),
  hemiSky: new THREE.Color('#d6e9ff'),
  hemiGround: new THREE.Color('#8d826f'),
  sun: new THREE.Color('#fff0da'),
}

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFrag = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 c;
    if (h > 0.0) {
      vec3 low = mix(uHorizon, uMid, smoothstep(0.0, 0.22, h));
      c = mix(low, uTop, smoothstep(0.18, 0.75, h));
    } else {
      c = mix(uHorizon, uBottom, smoothstep(0.0, 0.06, -h));
    }
    gl_FragColor = vec4(c, 1.0);
  }
`

/** Céu, luzes, neblina e o driver que anima todos os uniforms compartilhados. */
export function Atmosphere() {
  const sky = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTop: { value: NIGHT.top.clone() },
          uMid: { value: NIGHT.mid.clone() },
          uHorizon: { value: NIGHT.horizon.clone() },
          uBottom: { value: NIGHT.bottom.clone() },
        },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  )
  const hemi = useRef<THREE.HemisphereLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const moon = useRef<THREE.Mesh>(null)
  const stars = useRef<THREE.Group>(null)
  const { scene } = useThree()

  useMemo(() => {
    scene.fog = new THREE.FogExp2(NIGHT.fog.clone(), 0.00026)
  }, [scene])

  const tmp = new THREE.Color()
  useFrame((_, dt) => {
    const s = useStore.getState()
    const k = Math.min(1, dt * 2.2)
    const n = (fx.uNight.value += ((s.noite ? 1 : 0) - fx.uNight.value) * k)
    fx.uTime.value += dt
    // filtro da tabela: liga suave e troca a situação filtrada na hora
    const filtering = s.filtro !== 'todos'
    fx.uFilterOn.value += ((filtering ? 1 : 0) - fx.uFilterOn.value) * Math.min(1, dt * 5)
    if (filtering) fx.uFilter.value = STATUS_CODE[s.filtro as keyof typeof STATUS_CODE]
    // revelação das unidades de baixo para cima
    if (s.destacar && s.pronto) {
      fx.uShow.value += (1 - fx.uShow.value) * Math.min(1, dt * 6)
      fx.uReveal.value = Math.min(1, fx.uReveal.value + dt / 1.5)
    } else {
      fx.uShow.value += (0 - fx.uShow.value) * Math.min(1, dt * 6)
      if (fx.uShow.value < 0.01) fx.uReveal.value = 0
    }
    fx.uLevels.value = TOTAL_ANDARES + 1
    fx.uHover.value = s.emFoco ? (INDICE.get(s.emFoco) ?? -1) : -1
    fx.uSelected.value = s.selecionado ? (INDICE.get(s.selecionado) ?? -1) : -1

    sky.uniforms.uTop.value.copy(DAY.top).lerp(NIGHT.top, n)
    sky.uniforms.uMid.value.copy(DAY.mid).lerp(NIGHT.mid, n)
    sky.uniforms.uHorizon.value.copy(DAY.horizon).lerp(NIGHT.horizon, n)
    sky.uniforms.uBottom.value.copy(DAY.bottom).lerp(NIGHT.bottom, n)
    const fog = scene.fog as THREE.FogExp2
    fog.color.copy(DAY.fog).lerp(NIGHT.fog, n)
    fog.density = THREE.MathUtils.lerp(0.00021, 0.0003, n)
    if (hemi.current) {
      hemi.current.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, n)
      hemi.current.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, n)
      hemi.current.intensity = THREE.MathUtils.lerp(1.15, 1.35, n)
    }
    if (sun.current) {
      sun.current.color.copy(tmp.copy(DAY.sun).lerp(NIGHT.sun, n))
      // de dia o sol vem da frente e da esquerda; à noite a luz da lua vem dos fundos
      sun.current.intensity = THREE.MathUtils.lerp(2.6, 1.25, n)
      sun.current.position.set(THREE.MathUtils.lerp(-120, 70, n), THREE.MathUtils.lerp(165, 85, n), THREE.MathUtils.lerp(-110, 170, n))
    }
    scene.environmentIntensity = THREE.MathUtils.lerp(0.95, 0.55, n)
    for (const t of nightTuned) t.m.emissiveIntensity = THREE.MathUtils.lerp(t.day, t.night, n)
    for (const t of envTuned) t.m.envMapIntensity = THREE.MathUtils.lerp(t.day, t.night, n)
    for (const t of fadeTuned) t.m.opacity = THREE.MathUtils.lerp(t.day, t.night, n)
    if (moon.current) moon.current.visible = n > 0.05
    if (stars.current) stars.current.visible = n > 0.6
  })

  return (
    <>
      <mesh material={sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[5200, 32, 16]} />
      </mesh>
      <hemisphereLight ref={hemi} intensity={0.9} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={10}
        shadow-camera-far={420}
      />
      <group ref={stars}>
        <Stars radius={2400} depth={600} count={1400} factor={55} saturation={0} fade speed={0.3} />
      </group>
      <mesh ref={moon} position={[1500, 1150, 2300]}>
        <circleGeometry args={[46, 40]} />
        <meshBasicMaterial color={[3.2, 3.1, 2.8]} toneMapped={false} fog={false} />
      </mesh>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[60, 60, 1]} color="#dfe8ff" />
        <Lightformer form="rect" intensity={1.2} position={[-40, 8, -30]} scale={[40, 10, 1]} color="#ffe6c8" />
        <Lightformer form="rect" intensity={1} position={[40, 6, 30]} scale={[40, 8, 1]} color="#cfe0ff" />
        <Lightformer form="ring" intensity={0.6} position={[0, 4, 50]} scale={14} color="#ffffff" />
      </Environment>
    </>
  )
}
