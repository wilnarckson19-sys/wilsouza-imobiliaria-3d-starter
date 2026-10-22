import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Face, Janela, Predio } from '@/dados/tipos'
import type { FacadeTextureSpec, PaintRect } from './facadeTexture'

/*
 * Gera o prédio a partir do desenho em src/config/predio.ts. Paredes têm recortes reais nas janelas,
 * com requadro, peitoril e caixilho; as varandas têm laje e guarda-corpo de vidro. Os vidros são
 * instanciados com a situação de cada apartamento, lida pelo shader que desenha o interior.
 */

export type MatKey =
  | 'wallLong'
  | 'wallGable'
  | 'reveal'
  | 'sill'
  | 'frame'
  | 'plinth'
  | 'roof'
  | 'cornice'
  | 'lobby'
  | 'metal'
  | 'balcony'
  | 'railing'
  | 'ledLine'
  | 'core'

type GeoMap = Partial<Record<MatKey, THREE.BufferGeometry>>

export interface InstanceSet {
  matrices: THREE.Matrix4[]
  level: number[]
  unit: number[]
  seed: number[]
  /** janelas: largura, altura, centro acima do piso, tipo (0 quarto, 1 sala) */
  room?: number[]
}

export interface PanelSet {
  matrices: THREE.Matrix4[]
  level: number[]
  unit: number[]
  size: [number, number][]
}

export interface BuildingBuild {
  body: GeoMap
  windows: InstanceSet
  acs: InstanceSet
  panels: PanelSet
  height: number
  texture: { spec: FacadeTextureSpec; long: PaintRect[]; gable: PaintRect[] }
}

/** piso do térreo acima do terreno */
export const BASE = 0.3
const PARAPET = 1.2

const NORMAL: Record<Face, THREE.Vector3> = {
  nz: new THREE.Vector3(0, 0, -1),
  pz: new THREE.Vector3(0, 0, 1),
  nx: new THREE.Vector3(-1, 0, 0),
  px: new THREE.Vector3(1, 0, 0),
}
export const FACE_ROT: Record<Face, number> = { nz: Math.PI, pz: 0, nx: -Math.PI / 2, px: Math.PI / 2 }
export const faceNormal = (f: Face) => NORMAL[f].clone()
const isLong = (f: Face) => f === 'nz' || f === 'pz'

/** altura do piso de um andar (0 = térreo), medida a partir do chão */
export const levelY = (p: Predio, lv: number) => BASE + (lv === 0 ? 0 : p.alturaTerreo + (lv - 1) * p.alturaAndar)
export const levelH = (p: Predio, lv: number) => (lv === 0 ? p.alturaTerreo : p.alturaAndar)

/** ponto na face: `at` ao longo da face, `y` altura, `off` distância para fora da parede */
export function facePoint(p: Predio, face: Face, at: number, y: number, off: number) {
  const hl = p.comprimento / 2
  const hd = p.profundidade / 2
  switch (face) {
    case 'nz':
      return new THREE.Vector3(at, y, -hd - off)
    case 'pz':
      return new THREE.Vector3(at, y, hd + off)
    case 'nx':
      return new THREE.Vector3(-hl - off, y, at)
    case 'px':
      return new THREE.Vector3(hl + off, y, at)
  }
}

function boxAt(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y, z)
  const n = g.toNonIndexed()
  g.dispose()
  return n
}

/** caixa encostada na face, de `a0` a `a1`, de y0 a y1; `o0`/`o1` medidos para fora da parede */
function faceBox(p: Predio, face: Face, a0: number, a1: number, y0: number, y1: number, o0: number, o1: number) {
  const c = facePoint(p, face, (a0 + a1) / 2, (y0 + y1) / 2, (o0 + o1) / 2)
  const len = Math.abs(a1 - a0)
  const dep = Math.abs(o1 - o0)
  return isLong(face) ? boxAt(len, y1 - y0, dep, c.x, c.y, c.z) : boxAt(dep, y1 - y0, len, c.x, c.y, c.z)
}

/** quadrilátero com a normal dada (ordena os vértices para ficar de frente para ela) */
function quad(pts: THREE.Vector3[], normal: THREE.Vector3) {
  const [a, b, c, d] = pts
  const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a))
  const tri = n.dot(normal) >= 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c]
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flatMap((v) => [v.x, v.y, v.z]), 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(6).fill(0).flatMap(() => [normal.x, normal.y, normal.z]), 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(12), 2))
  return g
}

/** parede de uma face num intervalo de altura, com furos retangulares; o UV mapeia a textura da fachada */
function wallWithHoles(p: Predio, face: Face, y0: number, y1: number, holes: { a0: number; a1: number; y0: number; y1: number }[], H: number) {
  const span = isLong(face) ? p.comprimento : p.profundidade
  const shape = new THREE.Shape()
  shape.moveTo(-span / 2, y0)
  shape.lineTo(span / 2, y0)
  shape.lineTo(span / 2, y1)
  shape.lineTo(-span / 2, y1)
  shape.closePath()
  for (const h of holes) {
    const path = new THREE.Path()
    path.moveTo(h.a0, h.y0)
    path.lineTo(h.a0, h.y1)
    path.lineTo(h.a1, h.y1)
    path.lineTo(h.a1, h.y0)
    path.closePath()
    shape.holes.push(path)
  }
  const src = new THREE.ShapeGeometry(shape, 1)
  const flat = src.toNonIndexed()
  src.dispose()
  const pos = flat.getAttribute('position') as THREE.BufferAttribute
  const out = new Float32Array(pos.count * 3)
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    const a = pos.getX(i)
    const y = pos.getY(i)
    const v = facePoint(p, face, a, y, 0)
    out[i * 3] = v.x
    out[i * 3 + 1] = v.y
    out[i * 3 + 2] = v.z
    uv[i * 2] = (a + span / 2) / span
    uv[i * 2 + 1] = (y - BASE) / H
  }
  flat.dispose()
  // garante que todos os triângulos fiquem virados para fora
  const n = faceNormal(face)
  const A = new THREE.Vector3()
  const B = new THREE.Vector3()
  const C = new THREE.Vector3()
  for (let i = 0; i < out.length; i += 9) {
    A.fromArray(out, i)
    B.fromArray(out, i + 3)
    C.fromArray(out, i + 6)
    const fn = B.clone().sub(A).cross(C.clone().sub(A))
    if (fn.dot(n) < 0) {
      for (let k = 0; k < 3; k++) {
        const tmp = out[i + 3 + k]
        out[i + 3 + k] = out[i + 6 + k]
        out[i + 6 + k] = tmp
      }
      const j = (i / 3) * 2
      const tu = uv[j + 2]
      const tv = uv[j + 3]
      uv[j + 2] = uv[j + 4]
      uv[j + 3] = uv[j + 5]
      uv[j + 4] = tu
      uv[j + 5] = tv
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(out, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(out.length / 3).fill(0).flatMap(() => [n.x, n.y, n.z]), 3))
  return g
}

/** requadro (faces internas) de um vão, com profundidade `depth` */
function reveal(p: Predio, face: Face, a0: number, a1: number, y0: number, y1: number, depth: number) {
  const P = (a: number, y: number, o: number) => facePoint(p, face, a, y, o)
  const along = isLong(face) ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1)
  const up = new THREE.Vector3(0, 1, 0)
  return [
    quad([P(a0, y0, 0), P(a1, y0, 0), P(a1, y0, -depth), P(a0, y0, -depth)], up.clone()),
    quad([P(a0, y1, 0), P(a1, y1, 0), P(a1, y1, -depth), P(a0, y1, -depth)], up.clone().negate()),
    quad([P(a0, y0, 0), P(a0, y1, 0), P(a0, y1, -depth), P(a0, y0, -depth)], along.clone()),
    quad([P(a1, y0, 0), P(a1, y1, 0), P(a1, y1, -depth), P(a1, y0, -depth)], along.clone().negate()),
  ]
}

function push(map: Partial<Record<MatKey, THREE.BufferGeometry[]>>, k: MatKey, g: THREE.BufferGeometry | THREE.BufferGeometry[]) {
  const list = (map[k] ??= [])
  if (Array.isArray(g)) list.push(...g)
  else list.push(g)
}

/** junta todas as peças de cada material numa geometria só (menos trabalho para a placa de vídeo) */
function merge(map: Partial<Record<MatKey, THREE.BufferGeometry[]>>): GeoMap {
  const out: GeoMap = {}
  for (const k of Object.keys(map) as MatKey[]) {
    const list = map[k]!.map((g) => {
      let geo = g
      if (geo.index) {
        geo = g.toNonIndexed()
        g.dispose()
      }
      if (!geo.getAttribute('uv')) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2))
      if (!geo.getAttribute('normal')) geo.computeVertexNormals()
      return geo
    })
    out[k] = mergeGeometries(list, false)!
    list.forEach((g) => g.dispose())
  }
  return out
}

const span0 = (j: Janela) => j.centro - j.largura / 2
const span1 = (j: Janela) => j.centro + j.largura / 2

/** caixilho: contorno e montantes; a porta da varanda tem três folhas, a janela do quarto duas */
function frameFor(p: Predio, j: Janela, y0: number) {
  const th = 0.05
  const d0 = -0.12
  const d1 = -0.065
  const a0 = span0(j)
  const a1 = span1(j)
  const s = y0 + j.peitoril
  const h = s + j.altura
  const parts: THREE.BufferGeometry[] = [
    faceBox(p, j.face, a0, a1, s, s + th, d0, d1),
    faceBox(p, j.face, a0, a1, h - th, h, d0, d1),
    faceBox(p, j.face, a0, a0 + th, s, h, d0, d1),
    faceBox(p, j.face, a1 - th, a1, s, h, d0, d1),
  ]
  const leaves = j.comodo === 'sala' ? 3 : 2
  for (let k = 1; k < leaves; k++) {
    const m = a0 + ((a1 - a0) * k) / leaves
    parts.push(faceBox(p, j.face, m - th * 0.7, m + th * 0.7, s, h, d0 - 0.012, d1 + 0.012))
  }
  return parts
}

/** varanda: laje saliente, guarda-corpo de vidro na frente e nas laterais, corrimão fino */
function balcony(p: Predio, j: Janela, y0: number, map: Partial<Record<MatKey, THREE.BufferGeometry[]>>) {
  const dv = j.varanda!
  const a0 = span0(j) - 0.35
  const a1 = span1(j) + 0.35
  const top = y0 + 1.08
  push(map, 'balcony', faceBox(p, j.face, a0, a1, y0 - 0.16, y0 + 0.04, 0, dv))
  push(map, 'railing', faceBox(p, j.face, a0 + 0.04, a1 - 0.04, y0 + 0.04, top, dv - 0.08, dv - 0.05))
  push(map, 'railing', faceBox(p, j.face, a0, a0 + 0.03, y0 + 0.04, top, 0.02, dv - 0.06))
  push(map, 'railing', faceBox(p, j.face, a1 - 0.03, a1, y0 + 0.04, top, 0.02, dv - 0.06))
  push(map, 'metal', faceBox(p, j.face, a0, a1, top, top + 0.045, dv - 0.1, dv - 0.03))
}

export function buildBuilding(p: Predio, floors: number, unitAt: (andar: number, posicao: number) => number): BuildingBuild {
  const L = p.comprimento
  const D = p.profundidade
  const hl = L / 2
  const hd = D / 2
  const fh = p.alturaAndar
  const yRoof = levelY(p, floors + 1)
  const yTop = yRoof + PARAPET
  const H = yTop - BASE
  const faces: Face[] = ['nz', 'pz', 'nx', 'px']
  const janelas = p.plantas.flatMap((pl) => pl.janelas.map((j) => ({ j, posicao: pl.posicao })))
  const m: Partial<Record<MatKey, THREE.BufferGeometry[]>> = {}

  // térreo: portaria com vitrine de vidro na frente e nos fundos
  const lobby: Partial<Record<Face, [number, number]>> = { nz: [-9, 9], pz: [-7, 7] }
  const yL = levelY(p, 0)
  for (const face of faces) {
    const lb = lobby[face]
    const holes = lb ? [{ a0: lb[0], a1: lb[1], y0: yL + 0.15, y1: yL + 3.9 }] : []
    push(m, isLong(face) ? 'wallLong' : 'wallGable', wallWithHoles(p, face, yL, yL + p.alturaTerreo, holes, H))
    if (lb) {
      push(m, 'reveal', reveal(p, face, lb[0], lb[1], yL + 0.15, yL + 3.9, 0.3))
      push(m, 'lobby', faceBox(p, face, lb[0], lb[1], yL + 0.15, yL + 3.9, -0.3, -0.26))
      for (let a = lb[0]; a <= lb[1] + 0.01; a += 1.5) push(m, 'metal', faceBox(p, face, a - 0.04, a + 0.04, yL + 0.15, yL + 3.9, -0.26, -0.2))
      push(m, 'metal', faceBox(p, face, lb[0], lb[1], yL + 2.9, yL + 2.96, -0.26, -0.2))
    }
  }
  push(m, 'plinth', boxAt(L + 0.1, BASE + 0.02, D + 0.1, 0, (BASE + 0.02) / 2 - 0.01, 0))
  // marquise da entrada, com friso de luz
  push(m, 'metal', faceBox(p, 'nz', -5, 5, yL + 4.0, yL + 4.28, 0, 3.4))
  push(m, 'ledLine', faceBox(p, 'nz', -5, 5, yL + 3.96, yL + 4.0, 3.3, 3.4))
  push(m, 'plinth', faceBox(p, 'nz', -4.2, 4.2, 0, 0.14, 0, 3.0))

  // andares com apartamentos
  for (let lv = 1; lv <= floors; lv++) {
    const y0 = levelY(p, lv)
    for (const face of faces) {
      const ops = janelas.filter((x) => x.j.face === face).map((x) => x.j)
      const holes = ops.map((j) => ({ a0: span0(j), a1: span1(j), y0: y0 + j.peitoril, y1: y0 + j.peitoril + j.altura }))
      push(m, isLong(face) ? 'wallLong' : 'wallGable', wallWithHoles(p, face, y0, y0 + fh, holes, H))
      for (const j of ops) {
        const s = y0 + j.peitoril
        push(m, 'reveal', reveal(p, face, span0(j), span1(j), s, s + j.altura, 0.16))
        if (!j.varanda) push(m, 'sill', faceBox(p, face, span0(j) - 0.05, span1(j) + 0.05, s - 0.045, s + 0.004, -0.02, 0.05))
        push(m, 'frame', frameFor(p, j, y0))
        if (j.varanda) balcony(p, j, y0, m)
      }
    }
  }
  // as varandas do último andar ganham cobertura
  for (const { j } of janelas) {
    if (!j.varanda) continue
    push(m, 'balcony', faceBox(p, j.face, span0(j) - 0.35, span1(j) + 0.35, yRoof - 0.04, yRoof + 0.2, 0, j.varanda))
  }

  // platibanda com cornija, friso de luz, laje de cobertura e casa de máquinas
  for (const face of faces) {
    const span = isLong(face) ? hl : hd
    push(m, isLong(face) ? 'wallLong' : 'wallGable', wallWithHoles(p, face, yRoof, yTop, [], H))
    push(m, 'cornice', faceBox(p, face, -span - 0.14, span + 0.14, yTop - 0.14, yTop, -0.22, 0.14))
    push(m, 'ledLine', faceBox(p, face, -span, span, yTop - 0.36, yTop - 0.3, 0, 0.05))
  }
  push(m, 'roof', boxAt(L - 0.3, 0.2, D - 0.3, 0, yRoof + 0.1, 0))
  push(m, 'cornice', boxAt(L - 0.2, PARAPET, 0.12, 0, yRoof + PARAPET / 2, hd - 0.12))
  push(m, 'cornice', boxAt(L - 0.2, PARAPET, 0.12, 0, yRoof + PARAPET / 2, -hd + 0.12))
  push(m, 'cornice', boxAt(0.12, PARAPET, D - 0.2, -hl + 0.12, yRoof + PARAPET / 2, 0))
  push(m, 'cornice', boxAt(0.12, PARAPET, D - 0.2, hl - 0.12, yRoof + PARAPET / 2, 0))
  {
    const [x0, z0, x1, z1] = p.nucleo
    const top = yRoof + 3.4
    push(m, 'core', boxAt(x1 - x0, top - yRoof, z1 - z0, (x0 + x1) / 2, (yRoof + top) / 2, (z0 + z1) / 2))
    push(m, 'cornice', boxAt(x1 - x0 + 0.3, 0.2, z1 - z0 + 0.3, (x0 + x1) / 2, top + 0.1, (z0 + z1) / 2))
    push(m, 'ledLine', boxAt(x1 - x0 + 0.06, 0.06, z1 - z0 + 0.06, (x0 + x1) / 2, top - 0.3, (z0 + z1) / 2))
  }
  const body = merge(m)

  // vidros, condensadoras e painéis de unidade
  const windows: InstanceSet = { matrices: [], level: [], unit: [], seed: [], room: [] }
  const acs: InstanceSet = { matrices: [], level: [], unit: [], seed: [] }
  const panels: PanelSet = { matrices: [], level: [], unit: [], size: [] }
  const q = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  const fract = (v: number) => v - Math.floor(v)

  for (let lv = 1; lv <= floors; lv++) {
    const y0 = levelY(p, lv)
    janelas.forEach(({ j, posicao }, k) => {
      const unit = unitAt(lv, posicao)
      q.setFromAxisAngle(up, FACE_ROT[j.face])
      const w = j.largura - 0.04
      const h = j.altura - 0.04
      const c = facePoint(p, j.face, j.centro, y0 + j.peitoril + j.altura / 2, -0.1)
      windows.matrices.push(new THREE.Matrix4().compose(c, q, new THREE.Vector3(w, h, 1)))
      windows.level.push(lv)
      windows.unit.push(unit)
      windows.seed.push(fract(Math.sin((lv + 1) * 12.9898 + k * 78.233) * 43758.5453))
      windows.room!.push(w, h, j.peitoril + j.altura / 2, j.comodo === 'sala' ? 1 : 0)
      if (j.ar) {
        const at = j.centro + (j.largura / 2 + 0.5) * (j.centro >= 0 ? 1 : -1)
        const a = facePoint(p, j.face, at, y0 + j.peitoril + j.altura - 0.22, 0.19)
        acs.matrices.push(new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1)))
        acs.level.push(lv)
        acs.unit.push(unit)
        acs.seed.push(0)
      }
    })
    for (const pl of p.plantas) {
      const unit = unitAt(lv, pl.posicao)
      const [x0, z0, x1, z1] = pl.retangulo
      for (const face of pl.faces) {
        const a = isLong(face) ? x0 : z0
        const b = isLong(face) ? x1 : z1
        const span = Math.abs(b - a) - 0.24
        const ph = fh - 0.3
        q.setFromAxisAngle(up, FACE_ROT[face])
        const c = facePoint(p, face, (a + b) / 2, y0 + fh / 2, 0.52)
        panels.matrices.push(new THREE.Matrix4().compose(c, q, new THREE.Vector3(span, ph, 1)))
        panels.level.push(lv)
        panels.unit.push(unit)
        panels.size.push([span, ph])
      }
    }
  }

  // pintura da fachada: base escura no térreo, faixas nas lajes, faixa central na cor de destaque
  const cor = p.cores
  const slabs = Array.from({ length: floors + 1 }, (_, i) => levelY(p, i + 1) - BASE)
  const long: PaintRect[] = [{ a0: -hl, a1: hl, y0: 0, y1: p.alturaTerreo + 0.1, color: cor.base }]
  const gable: PaintRect[] = [{ a0: -hd, a1: hd, y0: 0, y1: p.alturaTerreo + 0.1, color: cor.base }]
  for (const s of slabs.slice(0, -1)) {
    long.push({ a0: -hl, a1: hl, y0: s - 0.12, y1: s + 0.14, color: cor.faixa })
    gable.push({ a0: -hd, a1: hd, y0: s - 0.12, y1: s + 0.14, color: cor.faixa })
  }
  long.push({ a0: -1.25, a1: 1.25, y0: p.alturaTerreo + 0.1, y1: H, color: cor.destaque })
  gable.push({ a0: -1.1, a1: 1.1, y0: p.alturaTerreo + 0.1, y1: H, color: cor.faixa })
  for (let lv = 1; lv <= floors; lv++) {
    const s = levelY(p, lv) - BASE
    long.push({ a0: -0.42, a1: 0.42, y0: s + 0.9, y1: s + 2.3, color: cor.base })
  }

  return {
    body,
    windows,
    acs,
    panels,
    height: yTop,
    texture: { spec: { wall: cor.parede, H, slabs }, long, gable },
  }
}

/** centro (mundo) e normal da face principal de um apartamento, para enquadrar a câmera */
export function unitAnchor(p: Predio, andar: number, posicao: number) {
  const pl = p.plantas.find((x) => x.posicao === posicao)!
  const face = pl.faces[0]
  const [x0, z0, x1, z1] = pl.retangulo
  const at = isLong(face) ? (x0 + x1) / 2 : (z0 + z1) / 2
  const y = levelY(p, andar) + p.alturaAndar / 2
  return { point: facePoint(p, face, at, y, 0), normal: faceNormal(face), face }
}
