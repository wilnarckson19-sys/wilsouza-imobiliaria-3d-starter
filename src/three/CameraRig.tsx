import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type CameraControlsImpl from 'camera-controls'
import { cameras, predio } from '@/config/predio'
import type { PoseCamera } from '@/dados/tipos'
import { POR_NUMERO, useStore } from '@/store/store'
import { unitAnchor } from './buildingGeometry'

const isPhone = () => window.innerWidth < 760

/** em tela estreita a câmera recua para o prédio caber na largura (no celular em pé a lente já é mais aberta) */
function fit(p: PoseCamera, aspect: number): PoseCamera {
  const k = aspect >= 1.2 ? 1 : aspect < 0.8 ? 0.95 : Math.min(1.3, 1.2 / aspect)
  if (k === 1) return p
  const [tx, , tz] = p.alvo
  return {
    pos: [tx + (p.pos[0] - tx) * k, Math.max(p.pos[1], 6), tz + (p.pos[2] - tz) * k],
    alvo: p.alvo,
  }
}

function go(c: CameraControlsImpl, p: PoseCamera, smooth = true) {
  return c.setLookAt(p.pos[0], p.pos[1], p.pos[2], p.alvo[0], p.alvo[1], p.alvo[2], smooth)
}

/** enquadramento de um apartamento: de frente para a fachada, um pouco de lado e acima */
function unitPose(numero: string): { pose: PoseCamera; offset: [number, number] } | null {
  const a = POR_NUMERO.get(numero)
  if (!a) return null
  const { point, normal } = unitAnchor(predio, a.andar, a.posicao)
  const phone = isPhone()
  const dist = phone ? 92 : 70
  const side = new THREE.Vector3(-normal.z, 0, normal.x)
  const pos = point.clone().addScaledVector(normal, dist).addScaledVector(side, dist * 0.32)
  pos.y += 6
  if (pos.y < 3) pos.y = 3
  return {
    pose: { pos: [pos.x, pos.y, pos.z], alvo: [point.x, point.y, point.z] },
    // desloca o enquadramento para o apartamento não ficar atrás do cartão de detalhes
    offset: phone ? [0, dist * 0.17] : [-dist * 0.1, dist * 0.03],
  }
}

/** Câmera: abertura, vistas prontas, voo até o apartamento selecionado e giro automático. */
export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null)
  const saved = useRef<PoseCamera | null>(null)
  const { camera, size } = useThree()
  const aspect = size.width / size.height

  const savePose = () => {
    const c = ref.current
    if (!c || saved.current) return
    const p = c.getPosition(new THREE.Vector3(), true)
    const t = c.getTarget(new THREE.Vector3(), true)
    saved.current = { pos: [p.x, p.y, p.z], alvo: [t.x, t.y, t.z] }
  }
  const restore = () => {
    const c = ref.current
    if (!c) return
    c.setFocalOffset(0, 0, 0, true)
    if (saved.current) go(c, saved.current)
    saved.current = null
  }

  // abertura: a câmera começa longe e voa até o prédio
  useEffect(() => {
    const c = ref.current
    if (!c) return
    go(c, cameras.abertura, false)
    c.smoothTime = 1.3
    const t1 = setTimeout(() => go(c, fit(cameras.inicio, window.innerWidth / window.innerHeight), true), 250)
    const t2 = setTimeout(() => {
      c.smoothTime = 0.45
      useStore.getState().set({ pronto: true })
    }, 2600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    return useStore.subscribe((s, prev) => {
      const c = ref.current
      if (!c) return
      const asp = window.innerWidth / window.innerHeight
      if (s.vistaPedido !== prev.vistaPedido) {
        saved.current = null
        c.setFocalOffset(0, 0, 0, true)
        go(c, fit(cameras[s.vista], asp), true)
      }
      if (s.selecionado !== prev.selecionado) {
        if (s.selecionado) {
          savePose()
          const r = unitPose(s.selecionado)
          if (r) {
            go(c, r.pose, true)
            c.setFocalOffset(r.offset[0], r.offset[1], 0, true)
          }
        } else restore()
      }
    })
  }, [])

  // lente mais aberta em tela retrato (celular em pé)
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = aspect < 1 ? 50 : 34
    cam.updateProjectionMatrix()
  }, [camera, aspect])

  // ajuda para testes automáticos (só no modo de desenvolvimento): posição na tela de um apartamento
  useEffect(() => {
    if (!import.meta.env.DEV) return
    Object.assign(window, {
      __project: (numero: string) => {
        const a = POR_NUMERO.get(numero)
        if (!a) return null
        const v = unitAnchor(predio, a.andar, a.posicao).point.project(camera)
        return [Math.round(((v.x + 1) / 2) * size.width), Math.round(((1 - v.y) / 2) * size.height)]
      },
    })
  })

  useFrame((_, dt) => {
    const c = ref.current
    const s = useStore.getState()
    if (c && s.girar && s.pronto) c.rotate(dt * 0.09, 0, false)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={8}
      maxDistance={420}
      maxPolarAngle={Math.PI * 0.485}
      minPolarAngle={0.05}
      smoothTime={0.45}
      draggingSmoothTime={0.12}
      dollyToCursor
    />
  )
}
