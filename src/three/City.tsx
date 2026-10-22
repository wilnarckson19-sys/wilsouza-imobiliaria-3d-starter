import { useMemo } from 'react'
import * as THREE from 'three'
import { sorteio } from '@/lib/formato'
import { dotTexture, fade, tune, windowTextures } from './materials'
import { crownGeometry, leafMaterial } from './vegetation'

/*
 * Bairro genérico em baixa poligonagem: quadras de casas com telhado, prédios médios, prédios altos
 * no horizonte e luzes da cidade à noite. Tudo instanciado (uma única peça por tipo), para ficar leve.
 */

const ANGLE = 0 // alinhamento das quadras com o terreno
const GU = new THREE.Vector2(Math.cos(ANGLE), -Math.sin(ANGLE))
const GV = new THREE.Vector2(Math.sin(ANGLE), Math.cos(ANGLE))

const WALLS = ['#E9E3D6', '#DCD2BE', '#F1EEE7', '#CFC5B2', '#E7D8C1', '#D9DEE2', '#E3CFC0']
const ROOFS = ['#B4532E', '#A2492A', '#C2663E', '#8F4528', '#B85F3C']
const TREES = ['#2F5A33', '#36643A', '#2A4F2E', '#3E6B3C', '#2D5634']

function prism() {
  // telhado de duas águas, cumeeira ao longo de X, base 1 x 1, altura 1
  const g = new THREE.BufferGeometry()
  const v = [
    -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 1, 0, -0.5, 0, -0.5, 0.5, 1, 0, -0.5, 1, 0,
    -0.5, 0, 0.5, -0.5, 1, 0, 0.5, 1, 0, -0.5, 0, 0.5, 0.5, 1, 0, 0.5, 0, 0.5,
    -0.5, 0, -0.5, -0.5, 1, 0, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 1, 0,
  ]
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
  g.computeVertexNormals()
  return g
}

interface CityData {
  houses: { m: THREE.Matrix4[]; c: THREE.Color[] }
  roofs: { m: THREE.Matrix4[]; c: THREE.Color[] }
  plates: THREE.Matrix4[]
  mid: THREE.Matrix4[]
  sky: THREE.Matrix4[]
  trees: { m: THREE.Matrix4[]; c: THREE.Color[] }
  lights: Float32Array
  lightColors: Float32Array
  streetLights: Float32Array
}

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax
  const dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t))
}

function inside(px: number, pz: number, poly: [number, number][]) {
  let ok = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) ok = !ok
  }
  return ok
}

/** quadra livre se não encosta no terreno nem fica no caminho da câmera principal */
function blocked(x: number, z: number, lot: [number, number][], clear: [number, number][]) {
  if (inside(x, z, lot)) return true
  for (let i = 0; i < lot.length; i++) {
    const a = lot[i]
    const b = lot[(i + 1) % lot.length]
    if (distToSegment(x, z, a[0], a[1], b[0], b[1]) < 30) return true
  }
  for (const [cx, cz] of clear) if (distToSegment(x, z, 0, 0, cx * 1.25, cz * 1.25) < 46) return true
  return false
}

function generate(seed: number, lot: [number, number][], clear: [number, number][], radius: number): CityData {
  const rnd = sorteio(seed)
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ANGLE)
  const m4 = (x: number, y: number, z: number, sx: number, sy: number, sz: number, quat = q) =>
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), quat, new THREE.Vector3(sx, sy, sz))
  const out: CityData = {
    houses: { m: [], c: [] },
    roofs: { m: [], c: [] },
    plates: [],
    mid: [],
    sky: [],
    trees: { m: [], c: [] },
    lights: new Float32Array(0),
    lightColors: new Float32Array(0),
    streetLights: new Float32Array(0),
  }
  const lights: number[] = []
  const lightCols: number[] = []
  const street: number[] = []
  const CW = 72
  const CH = 42
  const BW = 60
  const BH = 30
  const world = (u: number, v: number) => new THREE.Vector2(GU.x * u + GV.x * v, GU.y * u + GV.y * v)
  const nU = Math.ceil(radius / CW) + 1
  const nV = Math.ceil(radius / CH) + 1
  for (let i = -nU; i <= nU; i++) {
    for (let j = -nV; j <= nV; j++) {
      const cu = i * CW + 20
      const cv = j * CH + 9
      const c = world(cu, cv)
      const r = c.length()
      if (r > radius || blocked(c.x, c.y, lot, clear)) continue
      // postes nas esquinas e no meio da quadra
      for (const du of [-CW / 2, 0]) {
        const p = world(cu + du, cv - CH / 2)
        street.push(p.x, 7, p.y)
      }
      const kind = rnd()
      out.plates.push(m4(c.x, 0.1, c.y, BW, 0.2, BH))
      if (kind < 0.06) {
        // praça arborizada
        for (let k = 0; k < 16; k++) {
          const p = world(cu + (rnd() - 0.5) * (BW - 6), cv + (rnd() - 0.5) * (BH - 6))
          const s = 2.4 + rnd() * 2.6
          out.trees.m.push(m4(p.x, s * 0.9 + 0.5, p.y, s, s * 0.9, s))
          out.trees.c.push(new THREE.Color(TREES[Math.floor(rnd() * TREES.length)]))
        }
        continue
      }
      if (kind < 0.24 && r > 150) {
        // prédio médio
        const n = 1 + Math.floor(rnd() * 2)
        for (let k = 0; k < n; k++) {
          const p = world(cu + (k - (n - 1) / 2) * 26, cv)
          const fl = 4 + Math.floor(rnd() * 6)
          const hgt = fl * 2.9
          out.mid.push(m4(p.x, hgt / 2 + 0.2, p.y, 16 + rnd() * 6, hgt, 12 + rnd() * 4))
        }
        continue
      }
      // casas ao longo dos dois lados maiores da quadra
      for (const side of [-1, 1]) {
        let u = -BW / 2 + 0.5
        while (u < BW / 2 - 4) {
          const w = 5 + rnd() * 4.5
          const d = 9 + rnd() * 4
          const two = rnd() < 0.3
          const hgt = two ? 5.6 + rnd() * 1.4 : 3 + rnd() * 0.8
          const p = world(cu + u + w / 2, cv + side * (BH / 2 - d / 2 - 0.4))
          out.houses.m.push(m4(p.x, hgt / 2 + 0.2, p.y, w - 0.35, hgt, d))
          out.houses.c.push(new THREE.Color(WALLS[Math.floor(rnd() * WALLS.length)]))
          if (rnd() < 0.68) {
            out.roofs.m.push(m4(p.x, hgt + 0.2, p.y, w - 0.2, 1.1 + rnd() * 0.6, d + 0.3))
            out.roofs.c.push(new THREE.Color(ROOFS[Math.floor(rnd() * ROOFS.length)]).multiplyScalar(0.85 + rnd() * 0.25))
          }
          if (rnd() < 0.42) {
            const f = world(cu + u + w / 2, cv + side * (BH / 2 + 0.3))
            lights.push(f.x, 1.6 + (two && rnd() < 0.5 ? 2.8 : 0), f.y)
            const warm = rnd()
            lightCols.push(...(warm < 0.8 ? [2.4, 1.5, 0.75] : [1.6, 1.9, 2.4]))
          }
          u += w
        }
        if (rnd() < 0.5) {
          const p = world(cu + (rnd() - 0.5) * BW, cv)
          const s = 2.2 + rnd() * 1.8
          out.trees.m.push(m4(p.x, s + 0.5, p.y, s, s * 0.9, s))
          out.trees.c.push(new THREE.Color(TREES[Math.floor(rnd() * TREES.length)]))
        }
      }
    }
  }
  // prédios altos espalhados no horizonte
  const up = new THREE.Vector3(0, 1, 0)
  for (let k = 0; k < 140; k++) {
    const a = rnd() * Math.PI * 2
    const dist = 1500 + rnd() * 1300
    const x = Math.cos(a) * dist
    const z = Math.sin(a) * dist
    const hgt = 30 + rnd() * rnd() * 110
    const qq = new THREE.Quaternion().setFromAxisAngle(up, rnd() * Math.PI)
    out.sky.push(m4(x, hgt / 2, z, 20 + rnd() * 14, hgt, 20 + rnd() * 12, qq))
  }
  // luzes da cidade até o horizonte
  for (let k = 0; k < 24000; k++) {
    const a = rnd() * Math.PI * 2
    const dist = radius + Math.pow(rnd(), 0.7) * 3100
    lights.push(Math.cos(a) * dist, 1.5, Math.sin(a) * dist)
    const warm = rnd()
    lightCols.push(...(warm < 0.85 ? [2.2, 1.3, 0.6] : [1.6, 1.8, 2.2]))
  }
  out.lights = new Float32Array(lights)
  out.lightColors = new Float32Array(lightCols)
  out.streetLights = new Float32Array(street)
  return out
}

function useInstanced(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], list: THREE.Matrix4[], colors?: THREE.Color[]) {
  return useMemo(() => {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length))
    mesh.count = list.length
    list.forEach((m, i) => mesh.setMatrixAt(i, m))
    colors?.forEach((c, i) => mesh.setColorAt(i, c))
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    return mesh
  }, [geo, mat, list, colors])
}

export function City({ seed = 29, lot, clear }: { seed?: number; lot: [number, number][]; clear: [number, number][] }) {
  const data = useMemo(() => generate(seed, lot, clear, 760), [seed, lot, clear])
  const geos = useMemo(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      roof: prism(),
      tree: crownGeometry(77, 0, 4),
    }),
    [],
  )
  const mats = useMemo(() => {
    const win = windowTextures(5)
    const facade = tune(
      new THREE.MeshStandardMaterial({ map: win.map, emissiveMap: win.emissive, emissive: '#ffffff', roughness: 0.85 }),
      0,
      1.5,
    )
    const top = new THREE.MeshStandardMaterial({ color: '#8e9196', roughness: 0.95 })
    const pts = (size: number, opacity: number) =>
      fade(
        new THREE.PointsMaterial({
          size,
          map: dotTexture(),
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
          opacity,
        }),
        0,
        opacity,
      )
    const street = fade(
      new THREE.PointsMaterial({
        size: 3.2,
        map: dotTexture(),
        color: new THREE.Color(2.6, 1.6, 0.7),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
      0,
      1,
    )
    return {
      house: new THREE.MeshStandardMaterial({ roughness: 0.92 }),
      roof: new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }),
      plate: new THREE.MeshStandardMaterial({ color: '#8f8c84', roughness: 1 }),
      tree: leafMaterial(),
      building: [facade, facade, top, top, facade, facade],
      lights: pts(3.6, 1),
      street,
      ground: new THREE.MeshStandardMaterial({ color: '#6d726c', roughness: 1 }),
    }
  }, [])

  const houses = useInstanced(geos.box, mats.house, data.houses.m, data.houses.c)
  const roofs = useInstanced(geos.roof, mats.roof, data.roofs.m, data.roofs.c)
  const plates = useInstanced(geos.box, mats.plate, data.plates)
  const mid = useInstanced(geos.box, mats.building, data.mid)
  const sky = useInstanced(geos.box, mats.building, data.sky)
  const trees = useInstanced(geos.tree, mats.tree, data.trees.m, data.trees.c)

  const lightGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.lights, 3))
    g.setAttribute('color', new THREE.BufferAttribute(data.lightColors, 3))
    return g
  }, [data])
  const streetGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.streetLights, 3))
    return g
  }, [data])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05} receiveShadow material={mats.ground}>
        <planeGeometry args={[16000, 16000]} />
      </mesh>
      <primitive object={plates} />
      <primitive object={houses} />
      <primitive object={roofs} />
      <primitive object={mid} />
      <primitive object={sky} />
      <primitive object={trees} />
      <points geometry={lightGeo} material={mats.lights} frustumCulled={false} />
      <points geometry={streetGeo} material={mats.street} frustumCulled={false} />
    </group>
  )
}
