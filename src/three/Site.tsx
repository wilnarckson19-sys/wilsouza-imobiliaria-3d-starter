import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { predio, terreno } from '@/config/predio'
import { sorteio } from '@/lib/formato'
import { dotTexture, fade, tune } from './materials'
import { buildTrees, type TreeSpec } from './vegetation'

let grassTex: THREE.CanvasTexture | null = null
/** gramado com manchas, repetido em coordenadas do mundo */
function grassTexture() {
  if (grassTex) return grassTex
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#b9c4a6'
  ctx.fillRect(0, 0, 256, 256)
  let s = 9
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 2600; i++) {
    const v = 150 + rnd() * 105
    ctx.fillStyle = `rgba(${v * 0.85},${v},${v * 0.7},${0.25 + rnd() * 0.3})`
    const r = 1 + rnd() * 5
    ctx.beginPath()
    ctx.arc(rnd() * 256, rnd() * 256, r, 0, Math.PI * 2)
    ctx.fill()
  }
  grassTex = new THREE.CanvasTexture(c)
  grassTex.colorSpace = THREE.SRGBColorSpace
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping
  grassTex.repeat.set(0.12, 0.12)
  return grassTex
}

/** polígono [x, z] extrudado para cima (altura h), apoiado em y0 */
export function polyGeometry(pts: [number, number][], h: number, y0 = 0) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false })
  g.rotateX(-Math.PI / 2)
  g.translate(0, y0, 0)
  return g
}

function wallGeometry(pts: [number, number][], h: number, t = 0.25, skip: number[] = []) {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < pts.length; i++) {
    if (skip.includes(i)) continue
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const g = new THREE.BoxGeometry(len, h, t)
    g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]))
    g.translate((a[0] + b[0]) / 2, h / 2, (a[1] + b[1]) / 2)
    parts.push(g)
  }
  return parts
}

/** Terreno do condomínio: piso, rua, gramados, piscina iluminada, muro, postes e árvores. */
export function Site() {
  const site = terreno
  const geo = useMemo(() => {
    const lampPos: number[] = []
    // luminárias ao longo do perímetro interno
    const lot = site.lote
    for (let i = 0; i < lot.length; i++) {
      const a = lot[i]
      const b = lot[(i + 1) % lot.length]
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const n = Math.floor(len / 14)
      for (let k = 1; k < n; k++) {
        const t = k / n
        const x = a[0] + (b[0] - a[0]) * t
        const z = a[1] + (b[1] - a[1]) * t
        const cx = x * 0.94
        const cz = z * 0.94
        lampPos.push(cx, 3.2, cz)
      }
    }
    // faixa tracejada no eixo da rua
    const dashes: THREE.Matrix4[] = []
    if (site.rua.length === 4) {
      const [a, b, c, d] = site.rua
      const p0 = [(a[0] + d[0]) / 2, (a[1] + d[1]) / 2]
      const p1 = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2]
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
      const ang = -Math.atan2(p1[1] - p0[1], p1[0] - p0[0])
      const qd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ang)
      for (let t = 0; t < len; t += 9) {
        const k = t / len
        dashes.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(p0[0] + (p1[0] - p0[0]) * k, 0.13, p0[1] + (p1[1] - p0[1]) * k),
            qd,
            new THREE.Vector3(3.2, 0.02, 0.16),
          ),
        )
      }
    }
    return {
      dashes,
      lot: polyGeometry(site.lote, 0.3),
      street: polyGeometry(site.rua, 0.12),
      grass: site.gramados.map((p) => polyGeometry(p, 0.36)),
      deck: polyGeometry(site.deck, 0.42),
      pools: [polyGeometry(site.piscina, 0.1, 0.38)],
      walls: wallGeometry(site.lote, 2.1, 0.22, [0]),
      fence: wallGeometry(site.lote, 1.9, 0.08).slice(0, 1),
      lamps: new Float32Array(lampPos),
    }
  }, [site])

  const mats = useMemo(
    () => ({
      lot: new THREE.MeshStandardMaterial({ color: '#a8a59d', roughness: 0.95 }),
      street: new THREE.MeshStandardMaterial({ color: '#3a3d43', roughness: 0.9 }),
      grass: new THREE.MeshStandardMaterial({ color: '#4a6b37', roughness: 1, map: grassTexture() }),
      deck: new THREE.MeshStandardMaterial({ color: '#8a5c3d', roughness: 0.8 }),
      pool: tune(
        new THREE.MeshStandardMaterial({ color: '#2aa6d8', roughness: 0.08, metalness: 0.2, emissive: '#1fb4ff' }),
        0.15,
        1.6,
      ),
      wall: new THREE.MeshStandardMaterial({ color: '#efeee9', roughness: 0.9 }),
      fence: new THREE.MeshStandardMaterial({ color: '#d7d7d2', roughness: 0.5, metalness: 0.3, transparent: true, opacity: 0.55 }),
      dash: new THREE.MeshStandardMaterial({ color: '#e8e4d8', roughness: 0.7 }),
      lamps: fade(
        new THREE.PointsMaterial({
          size: 2.4,
          map: dotTexture(),
          color: new THREE.Color(2.8, 2.0, 1.1),
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        }),
        0,
        1,
      ),
    }),
    [],
  )

  const treeMeshes = useMemo(() => {
    const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mats.dash, Math.max(1, geo.dashes.length))
    geo.dashes.forEach((m, i) => dash.setMatrixAt(i, m))
    dash.count = geo.dashes.length
    dash.computeBoundingSphere()
    return { dash }
  }, [geo, mats])

  // árvores do terreno e cerca viva na base do prédio (livre na frente da portaria)
  const veg = useMemo(() => {
    const rnd = sorteio(7)
    const list: TreeSpec[] = site.arvores.map(([x, z, r], i) => ({ x, z, r, kind: i % 5 === 2 ? 'ipe' : 'arvore' }))
    const hl = predio.comprimento / 2
    const hd = predio.profundidade / 2
    for (const side of [-1, 1]) {
      for (let x = -hl + 0.8; x < hl - 0.6; x += 0.95) {
        if (Math.abs(x) < (side < 0 ? 10 : 8)) continue
        list.push({ x, z: side * (hd + 0.9), r: 0.62 + rnd() * 0.22, kind: 'arbusto' })
      }
    }
    return buildTrees(list, 9, 2)
  }, [site])
  useEffect(() => veg.dispose, [veg])

  const lampGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(geo.lamps, 3))
    return g
  }, [geo])

  return (
    <group>
      <mesh geometry={geo.lot} material={mats.lot} receiveShadow />
      <mesh geometry={geo.street} material={mats.street} receiveShadow />
      {geo.grass.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.grass} receiveShadow />
      ))}
      <mesh geometry={geo.deck} material={mats.deck} receiveShadow />
      {geo.pools.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.pool} />
      ))}
      {geo.walls.map((g, i) => (
        <mesh key={`w${i}`} geometry={g} material={mats.wall} castShadow receiveShadow />
      ))}
      {geo.fence.map((g, i) => (
        <mesh key={`f${i}`} geometry={g} material={mats.fence} />
      ))}
      <primitive object={treeMeshes.dash} />
      {veg.meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
      <points geometry={lampGeo} material={mats.lamps} />
    </group>
  )
}
