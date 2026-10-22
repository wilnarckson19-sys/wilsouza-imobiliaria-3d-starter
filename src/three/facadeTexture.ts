import * as THREE from 'three'

/*
 * Pinta a fachada (faixas, base escura, detalhes na cor de destaque) numa textura de canvas, com
 * granulado de reboco e leve sujeira na base, para não parecer cor chapada de jogo.
 */

/** retângulo de pintura: `a0`/`a1` ao longo da face e `y0`/`y1` em altura, medidos a partir do chão */
export interface PaintRect {
  a0: number
  a1: number
  y0: number
  y1: number
  color: string
}

export interface FacadeTextureSpec {
  wall: string
  /** altura total pintada (do chão ao topo da platibanda) */
  H: number
  /** alturas das lajes, para a sombra suave sob cada uma */
  slabs: number[]
}

const PPM = 40 // pixels por metro

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amount
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)
}

export function paintFacade(spec: FacadeTextureSpec, rects: PaintRect[], span: number, seed: number) {
  const W = Math.round(span * PPM)
  const Hpx = Math.round(spec.H * PPM)
  const c = document.createElement('canvas')
  c.width = W
  c.height = Hpx
  const ctx = c.getContext('2d')!
  ctx.fillStyle = spec.wall
  ctx.fillRect(0, 0, W, Hpx)
  const X = (a: number) => (a + span / 2) * PPM
  const Y = (y: number) => Hpx - y * PPM
  for (const r of rects) {
    ctx.fillStyle = r.color
    const x0 = X(r.a0)
    const x1 = X(r.a1)
    const y0 = Y(r.y1)
    const y1 = Y(r.y0)
    ctx.fillRect(Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0))
  }
  // sombra suave sob cada laje e sujeira leve perto do chão
  ctx.globalCompositeOperation = 'multiply'
  for (const s of spec.slabs) {
    const y = Y(s)
    const g = ctx.createLinearGradient(0, y, 0, y + 0.35 * PPM)
    g.addColorStop(0, 'rgba(0,0,0,0.10)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, y, W, 0.35 * PPM)
  }
  const g = ctx.createLinearGradient(0, Hpx - 2.2 * PPM, 0, Hpx)
  g.addColorStop(0, 'rgba(120,110,95,0)')
  g.addColorStop(1, 'rgba(120,110,95,0.35)')
  ctx.fillStyle = g
  ctx.fillRect(0, Hpx - 2.2 * PPM, W, 2.2 * PPM)
  ctx.globalCompositeOperation = 'source-over'
  grain(ctx, W, Hpx, 9, seed)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  return tex
}

let grille: THREE.CanvasTexture | null = null
/** frente da condensadora do ar-condicionado: grelha horizontal fina e o círculo do ventilador */
export function grilleTexture() {
  if (grille) return grille
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 176
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#e9e7e2'
  ctx.fillRect(0, 0, 256, 176)
  ctx.fillStyle = '#c9c6bf'
  ctx.fillRect(10, 10, 236, 156)
  ctx.strokeStyle = 'rgba(70,70,72,0.55)'
  ctx.lineWidth = 2
  for (let y = 16; y < 162; y += 6) {
    ctx.beginPath()
    ctx.moveTo(14, y)
    ctx.lineTo(242, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(60,60,64,0.5)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(150, 88, 62, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(40,40,44,0.35)'
  ctx.beginPath()
  ctx.arc(150, 88, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 3
  ctx.strokeRect(5, 5, 246, 166)
  grille = new THREE.CanvasTexture(c)
  grille.colorSpace = THREE.SRGBColorSpace
  grille.anisotropy = 4
  return grille
}
