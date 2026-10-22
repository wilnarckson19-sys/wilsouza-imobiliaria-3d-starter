import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { predio } from '@/config/predio'
import { apartamentos } from '@/dados/apartamentos'
import { TOTAL_ANDARES, indiceEm, useStore } from '@/store/store'
import { usePointer } from '@/store/pointer'
import { buildBuilding, type InstanceSet, type MatKey } from './buildingGeometry'
import { grilleTexture, paintFacade } from './facadeTexture'
import { STATUS_CODE, createGlassMaterial, createPanelMaterial, tune, withWash } from './materials'

const unitPlane = new THREE.PlaneGeometry(1, 1)
const acBox = new THREE.BoxGeometry(0.8, 0.56, 0.3)

function useMaterials(tex: { long: THREE.Texture; gable: THREE.Texture }) {
  return useMemo(() => {
    const std = (p: THREE.MeshStandardMaterialParameters, wash = 1) =>
      withWash(new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...p }), wash)
    const mats: Record<MatKey, THREE.Material> = {
      wallLong: std({ map: tex.long }),
      wallGable: std({ map: tex.gable }),
      reveal: std({ color: '#d6d2cb' }, 0.8),
      sill: std({ color: '#e9e6df', roughness: 0.7 }),
      frame: std({ color: '#2d3036', roughness: 0.45, metalness: 0.4 }, 0.5),
      plinth: std({ color: '#5b5e64', roughness: 0.95 }),
      roof: std({ color: '#9fa1a3', roughness: 1 }, 0.5),
      cornice: std({ color: '#ece8e2' }),
      metal: std({ color: '#25282d', roughness: 0.4, metalness: 0.6 }, 0.4),
      balcony: std({ color: '#f1eee8', roughness: 0.8 }),
      core: std({ color: predio.cores.base, roughness: 0.88 }),
      // vitrine da portaria: vidro com luz quente por dentro à noite
      lobby: tune(new THREE.MeshStandardMaterial({ color: '#1d232c', roughness: 0.1, metalness: 0.6, emissive: '#ffd7a8' }), 0.08, 1.7),
      // friso de LED na cor de destaque, aceso à noite
      ledLine: tune(new THREE.MeshStandardMaterial({ color: '#2a241c', emissive: predio.cores.destaque, roughness: 0.4 }), 0.15, 3.2),
      // guarda-corpo de vidro: transparente e sem escrever profundidade, para o destaque aparecer atrás
      railing: new THREE.MeshStandardMaterial({ color: '#a9c7d6', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false }),
    }
    return mats
  }, [tex])
}

function instanced(set: InstanceSet, material: THREE.Material | THREE.Material[], geometry: THREE.BufferGeometry, extra?: (g: THREE.BufferGeometry) => void) {
  const n = set.matrices.length
  const g = geometry.clone()
  g.setAttribute('aUnit', new THREE.InstancedBufferAttribute(new Float32Array(set.unit), 1))
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(set.seed), 1))
  g.setAttribute('aStatus', new THREE.InstancedBufferAttribute(new Float32Array(n), 1))
  g.setAttribute('aLevel', new THREE.InstancedBufferAttribute(new Float32Array(set.level), 1))
  extra?.(g)
  const mesh = new THREE.InstancedMesh(g, material, Math.max(1, n))
  mesh.count = n
  set.matrices.forEach((m, i) => mesh.setMatrixAt(i, m))
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  return mesh
}

/** O prédio: paredes, varandas, vidros com interior e os painéis clicáveis de cada apartamento. */
export function Building() {
  const build = useMemo(() => buildBuilding(predio, TOTAL_ANDARES, indiceEm), [])
  const tex = useMemo(
    () => ({
      long: paintFacade(build.texture.spec, build.texture.long, predio.comprimento, 7),
      gable: paintFacade(build.texture.spec, build.texture.gable, predio.profundidade, 11),
    }),
    [build],
  )
  const mats = useMaterials(tex)
  const glass = useMemo(createGlassMaterial, [])

  const meshes = useMemo(() => {
    const windows = instanced(build.windows, glass, unitPlane, (g) =>
      g.setAttribute('aRoom', new THREE.InstancedBufferAttribute(new Float32Array(build.windows.room!), 4)),
    )
    const acSide = withWash(new THREE.MeshStandardMaterial({ color: '#dcd9d3', roughness: 0.6 }), 0.9)
    const acFront = withWash(new THREE.MeshStandardMaterial({ map: grilleTexture(), roughness: 0.65 }), 0.9)
    const acs = instanced(build.acs, [acSide, acSide, acSide, acSide, acFront, acSide], acBox)
    acs.castShadow = true
    acs.receiveShadow = true
    const p = build.panels
    const pg = unitPlane.clone()
    pg.setAttribute('aUnit', new THREE.InstancedBufferAttribute(new Float32Array(p.unit), 1))
    pg.setAttribute('aLevel', new THREE.InstancedBufferAttribute(new Float32Array(p.level), 1))
    pg.setAttribute('aStatus', new THREE.InstancedBufferAttribute(new Float32Array(p.unit.length), 1))
    pg.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array(p.size.flat()), 2))
    const panels = new THREE.InstancedMesh(pg, createPanelMaterial(), Math.max(1, p.matrices.length))
    p.matrices.forEach((m, i) => panels.setMatrixAt(i, m))
    panels.renderOrder = 5
    panels.computeBoundingSphere()
    return { windows, acs, panels, acMats: [acSide, acFront] }
  }, [build, glass])

  // situação de cada apartamento nos atributos das instâncias (vidro e painel)
  useEffect(() => {
    const code = (idx: number) => (idx >= 0 && apartamentos[idx] ? STATUS_CODE[apartamentos[idx].status] : 0)
    const fill = (mesh: THREE.InstancedMesh, units: ArrayLike<number>) => {
      const a = mesh.geometry.getAttribute('aStatus') as THREE.InstancedBufferAttribute
      for (let i = 0; i < units.length; i++) a.setX(i, code(units[i]))
      a.needsUpdate = true
    }
    fill(meshes.windows, build.windows.unit)
    fill(meshes.panels, build.panels.unit)
  }, [meshes, build])

  useEffect(
    () => () => {
      meshes.windows.geometry.dispose()
      meshes.acs.geometry.dispose()
      meshes.panels.geometry.dispose()
      ;(meshes.panels.material as THREE.Material).dispose()
      meshes.acMats.forEach((m) => m.dispose())
    },
    [meshes],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])
  useEffect(() => () => Object.values(build.body).forEach((g) => g?.dispose()), [build])

  // o painel do apartamento pode estar atrás de uma varanda: procura o primeiro painel na linha do mouse
  const unitUnder = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const hit = e.intersections.find((h) => h.object === meshes.panels && h.instanceId !== undefined)
    if (!hit) return null
    const idx = build.panels.unit[hit.instanceId!]
    return idx >= 0 ? apartamentos[idx] : null
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const a = unitUnder(e)
    if (a) usePointer.setState({ x: e.nativeEvent.clientX, y: e.nativeEvent.clientY })
    useStore.getState().focar(a ? a.numero : null, '3d')
    document.body.style.cursor = a ? 'pointer' : ''
  }
  const onLeave = () => {
    useStore.getState().focar(null)
    document.body.style.cursor = ''
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    // arrastar para girar não conta como clique
    if (e.delta > 6) return
    const a = unitUnder(e)
    if (a) useStore.getState().selecionar(a.numero)
  }

  const bodyEntries = useMemo(() => Object.entries(build.body) as [MatKey, THREE.BufferGeometry][], [build])

  return (
    <group onPointerMove={onMove} onPointerLeave={onLeave} onClick={onClick}>
      {bodyEntries.map(([k, g]) => (
        <mesh key={k} geometry={g} material={mats[k]} castShadow={k !== 'railing' && k !== 'ledLine'} receiveShadow={k !== 'railing'} />
      ))}
      <primitive object={meshes.windows} />
      <primitive object={meshes.acs} />
      <primitive object={meshes.panels} />
    </group>
  )
}
