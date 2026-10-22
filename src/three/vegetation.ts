import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { sorteio } from '@/lib/formato'
import { fx } from './materials'

/*
 * Vegetação: copas feitas de vários volumes deformados por ruído, com sombreamento por altura nas
 * cores dos vértices e granulado de folhas no shader. Instanciadas, para caber centenas de árvores.
 */

function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}

function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const s = (t: number) => t * t * (3 - 2 * t)
  const u = s(xf)
  const v = s(yf)
  const w = s(zf)
  let r = 0
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++)
      for (let dz = 0; dz < 2; dz++) {
        const h = hash3(xi + dx, yi + dy, zi + dz)
        r += h * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w)
      }
  return r
}

function blob(r: number, detail: number, seed: number, amp: number) {
  const g = new THREE.IcosahedronGeometry(r, detail)
  const p = g.getAttribute('position') as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = noise3(v.x * 2.2 + seed, v.y * 2.2 + seed * 1.7, v.z * 2.2 - seed) * 0.7 + noise3(v.x * 5 + seed, v.y * 5, v.z * 5) * 0.3
    v.multiplyScalar(1 + (n - 0.5) * amp)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

/** copa com raio aproximado 1, centrada na origem */
export function crownGeometry(seed: number, detail = 2, lobes = 6) {
  const rnd = sorteio(seed)
  const parts: THREE.BufferGeometry[] = []
  const main = blob(0.78, detail, seed, 0.38)
  main.translate(0, 0.08, 0)
  parts.push(main)
  for (let i = 0; i < lobes - 1; i++) {
    const a = (i / (lobes - 1)) * Math.PI * 2 + rnd() * 0.6
    const r = 0.42 + rnd() * 0.2
    const g = blob(r, detail, seed + i * 3.3, 0.42)
    g.translate(Math.cos(a) * (0.5 + rnd() * 0.12), -0.12 + rnd() * 0.5, Math.sin(a) * (0.5 + rnd() * 0.12))
    parts.push(g)
  }
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)), false)!
  parts.forEach((g) => g.dispose())
  // cor por vértice: mais escuro embaixo e no miolo, como oclusão da copa
  const p = merged.getAttribute('position') as THREE.BufferAttribute
  const col = new Float32Array(p.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const k = THREE.MathUtils.smoothstep(v.y, -0.75, 0.85) * 0.55 + THREE.MathUtils.smoothstep(Math.hypot(v.x, v.z), 0.2, 1.0) * 0.25 + 0.38
    col.set([k, k, k], i * 3)
  }
  merged.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return merged
}

export function leafMaterial() {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = fx.uNight
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLeafP;').replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vLeafP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vLeafP = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif`,
    )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uNight;
        varying vec3 vLeafP;
        float lh(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        float vn(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(lh(i), lh(i + vec3(1.0, 0.0, 0.0)), f.x), mix(lh(i + vec3(0.0, 1.0, 0.0)), lh(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
            mix(mix(lh(i + vec3(0.0, 0.0, 1.0)), lh(i + vec3(1.0, 0.0, 1.0)), f.x), mix(lh(i + vec3(0.0, 1.0, 1.0)), lh(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
            f.z);
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          float n1 = vn(vLeafP * 3.2);
          float n2 = vn(vLeafP * 9.0 + 3.1);
          diffuseColor.rgb *= 0.66 + 0.46 * n1 + 0.22 * (n2 - 0.5);
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          // folhagem: cada "tufo" vira para um lado, quebrando as facetas da copa
          vec3 q = vLeafP * 4.5;
          vec3 j = vec3(vn(q), vn(q + 17.3), vn(q + 31.7)) - 0.5;
          vec3 k = vec3(vn(q * 2.7 + 5.0), vn(q * 2.7 + 9.0), vn(q * 2.7 + 2.0)) - 0.5;
          normal = normalize(normal + j * 1.3 + k * 0.6);
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          // refletores no chão iluminam a copa por baixo à noite
          float low = 1.0 - smoothstep(0.0, 9.0, vLeafP.y);
          totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.78, 0.5) * 0.28 * low * uNight;
        }`,
      )
  }
  m.customProgramCacheKey = () => 'leaf-v1'
  return m
}

export interface TreeSpec {
  x: number
  z: number
  r: number
  kind: 'arvore' | 'ipe' | 'arbusto'
}

const GREENS = ['#3f6b35', '#4c7a3a', '#365f30', '#58833f', '#2f5a2c', '#4f6f34']

export function buildTrees(list: TreeSpec[], seed = 5, detail = 2) {
  const rnd = sorteio(seed)
  const variants = [crownGeometry(11, detail), crownGeometry(23, detail, 5), crownGeometry(37, detail, 7)]
  const shrub = crownGeometry(51, 1, 4)
  const leaf = leafMaterial()
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5b4636', roughness: 1 })
  const trunkGeo = new THREE.CylinderGeometry(0.11, 0.2, 1, 7)
  trunkGeo.translate(0, 0.5, 0)
  const buckets: { m: THREE.Matrix4; c: THREE.Color }[][] = [[], [], [], []]
  const trunks: THREE.Matrix4[] = []
  const q = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  for (const t of list) {
    q.setFromAxisAngle(up, rnd() * Math.PI * 2)
    if (t.kind === 'arbusto') {
      const s = t.r
      buckets[3].push({
        m: new THREE.Matrix4().compose(new THREE.Vector3(t.x, s * 0.45, t.z), q, new THREE.Vector3(s, s * 0.7, s)),
        c: new THREE.Color(GREENS[Math.floor(rnd() * GREENS.length)]).multiplyScalar(0.95 + rnd() * 0.2),
      })
      continue
    }
    // tronco curto e copa larga, como árvores de paisagismo
    const h = t.r * (0.42 + rnd() * 0.3)
    const sx = t.r * (1.0 + rnd() * 0.2)
    const sy = t.r * (0.78 + rnd() * 0.2)
    trunks.push(new THREE.Matrix4().compose(new THREE.Vector3(t.x, 0, t.z), q, new THREE.Vector3(t.r * 0.8, h + sy * 0.5, t.r * 0.8)))
    const c =
      t.kind === 'ipe'
        ? new THREE.Color(rnd() < 0.5 ? '#e08bb7' : '#d47aa8').multiplyScalar(0.95 + rnd() * 0.15)
        : new THREE.Color(GREENS[Math.floor(rnd() * GREENS.length)]).multiplyScalar(0.92 + rnd() * 0.22)
    buckets[Math.floor(rnd() * 3)].push({
      m: new THREE.Matrix4().compose(new THREE.Vector3(t.x, h + sy * 0.62, t.z), q, new THREE.Vector3(sx, sy, sx)),
      c,
    })
  }
  const meshes: THREE.Object3D[] = []
  buckets.forEach((b, i) => {
    if (!b.length) return
    const mesh = new THREE.InstancedMesh(i < 3 ? variants[i] : shrub, leaf, b.length)
    b.forEach((it, k) => {
      mesh.setMatrixAt(k, it.m)
      mesh.setColorAt(k, it.c)
    })
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    meshes.push(mesh)
  })
  if (trunks.length) {
    const tm = new THREE.InstancedMesh(trunkGeo, trunkMat, trunks.length)
    trunks.forEach((m, k) => tm.setMatrixAt(k, m))
    tm.castShadow = true
    tm.computeBoundingSphere()
    meshes.push(tm)
  }
  const dispose = () => {
    variants.forEach((g) => g.dispose())
    shrub.dispose()
    leaf.dispose()
    trunkMat.dispose()
    trunkGeo.dispose()
  }
  return { meshes, dispose }
}
