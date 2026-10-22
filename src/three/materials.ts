import * as THREE from 'three'
import { cena, cores } from '@/config/empreendimento'

/*
 * Valores compartilhados por todos os materiais interativos ("uniforms", na linguagem dos shaders).
 * A Atmosfera anima esses valores a cada quadro; os componentes React só mudam o estado.
 */
export const fx = {
  uNight: { value: cena.comecarDeNoite ? 1 : 0 },
  uHover: { value: -1 },
  uSelected: { value: -1 },
  uTime: { value: 0 },
  /** destaque colorido das unidades (0 desligado, 1 ligado) */
  uShow: { value: 0 },
  /** revelação de baixo para cima quando o destaque liga */
  uReveal: { value: 0 },
  /** filtro de situação: -1 todos, 0 disponível, 1 reservado, 2 vendido */
  uFilter: { value: -1 },
  /** intensidade do filtro (anima ao ligar e desligar) */
  uFilterOn: { value: 0 },
  uLevels: { value: 12 },
  uAvail: { value: new THREE.Color(cores.disponivel) },
  uRes: { value: new THREE.Color(cores.reservado) },
  uSold: { value: new THREE.Color(cores.vendido) },
}

export const STATUS_CODE = { disponivel: 0, reservado: 1, vendido: 2 } as const

/*
 * Vidro com "interior mapping": cada janela desenha, por raio, o cômodo atrás dela (paredes, piso de
 * madeira, teto com luminária, um móvel e cortina em parte das unidades). À noite a luz acende
 * conforme a situação: vendido = luz quente, reservado = luz âmbar, disponível = apagado.
 */
export function createGlassMaterial() {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#06080c'),
    roughness: 0.06,
    metalness: 0.15,
    envMapIntensity: 1.5,
  })
  envTuned.push({ m, day: 1.5, night: 0.32 })
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uNight: fx.uNight,
      uHover: fx.uHover,
      uSelected: fx.uSelected,
      uTime: fx.uTime,
      uFilter: fx.uFilter,
      uFilterOn: fx.uFilterOn,
    })
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aUnit;
        attribute float aStatus;
        attribute float aSeed;
        attribute vec4 aRoom;
        varying float vUnit;
        varying float vStatus;
        varying float vSeed;
        varying vec4 vRoom;
        varying vec3 vRayO;
        varying vec3 vRayD;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vUnit = aUnit; vStatus = aStatus; vSeed = aSeed; vRoom = aRoom;
        {
          mat4 mw = modelMatrix * instanceMatrix;
          vec3 wp = (mw * vec4(position, 1.0)).xyz;
          vec3 T = normalize((mw * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
          vec3 B = normalize((mw * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
          vec3 N = normalize((mw * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
          vec3 V = wp - cameraPosition;
          vRayD = vec3(dot(V, T), dot(V, B), dot(V, N));
          vRayO = vec3(position.x * aRoom.x, position.y * aRoom.y, 0.0);
        }`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uNight;
        uniform float uHover;
        uniform float uSelected;
        uniform float uTime;
        uniform float uFilter;
        uniform float uFilterOn;
        varying float vUnit;
        varying float vStatus;
        varying float vSeed;
        varying vec4 vRoom;
        varying vec3 vRayO;
        varying vec3 vRayD;

        float h1(float n) { return fract(sin(n * 91.345) * 47453.5453); }

        // interseção raio x caixa alinhada; retorna t de entrada ou -1
        float boxHit(vec3 o, vec3 d, vec3 bmin, vec3 bmax, out vec3 nrm) {
          vec3 inv = 1.0 / d;
          vec3 t0 = (bmin - o) * inv;
          vec3 t1 = (bmax - o) * inv;
          vec3 tmin = min(t0, t1);
          vec3 tmax = max(t0, t1);
          float tn = max(max(tmin.x, tmin.y), tmin.z);
          float tf = min(min(tmax.x, tmax.y), tmax.z);
          if (tn > tf || tf < 0.0) return -1.0;
          nrm = tn == tmin.x ? vec3(-sign(d.x), 0.0, 0.0) : (tn == tmin.y ? vec3(0.0, -sign(d.y), 0.0) : vec3(0.0, 0.0, -sign(d.z)));
          return tn;
        }

        vec3 roomColor(vec3 o, vec3 d, float seed, float kind, float hc, out float lightMask) {
          float depth = kind > 0.5 ? 4.6 : 3.1;
          float rw = kind > 0.5 ? 4.2 : 2.7;
          float off = (h1(seed * 7.0) - 0.5) * 0.6;
          float floorY = -hc;
          float ceilY = 2.6 - hc;
          d.z = min(d.z, -1e-4);
          float tb = (-depth - o.z) / d.z;
          float tx = d.x > 0.0 ? (rw * 0.5 + off - o.x) / d.x : (-rw * 0.5 + off - o.x) / d.x;
          float ty = d.y > 0.0 ? (ceilY - o.y) / d.y : (floorY - o.y) / d.y;
          float t = min(tb, min(tx, ty));
          vec3 p = o + d * t;
          vec3 wallTint = mix(vec3(0.86, 0.82, 0.76), vec3(0.78, 0.80, 0.78), h1(seed * 3.1));
          vec3 col;
          float lamp;
          if (t == ty && d.y < 0.0) {
            // piso de madeira em réguas
            float plank = step(0.5, fract(p.x * 3.3 + floor(p.z * 0.9) * 0.37));
            col = mix(vec3(0.42, 0.30, 0.21), vec3(0.50, 0.37, 0.26), plank);
            lamp = 0.55;
          } else if (t == ty) {
            col = vec3(0.93);
            float r = length(vec2(p.x - off, p.z + depth * 0.5));
            lamp = 1.0 + 2.2 * smoothstep(0.5, 0.0, r);
          } else if (t == tb) {
            col = wallTint * 0.94;
            // porta ou quadro na parede do fundo
            float door = step(abs(p.x - off - (h1(seed * 5.0) - 0.5) * 1.2), 0.45) * step(p.y, 2.1 - hc);
            col = mix(col, vec3(0.55, 0.42, 0.32), door * 0.85);
            float art = step(abs(p.x - off + 0.9), 0.35) * step(abs(p.y - (1.55 - hc)), 0.25) * step(0.5, h1(seed * 9.0));
            col = mix(col, vec3(0.25, 0.35, 0.45), art);
            lamp = 0.8;
          } else {
            col = wallTint;
            lamp = 0.7;
          }
          // móvel: sofá na sala, cama no quarto
          vec3 nrm;
          float fh = kind > 0.5 ? 0.45 : 0.55;
          float fz = kind > 0.5 ? 0.9 : 2.0;
          vec3 bmin = vec3(off - 0.9, floorY, -depth);
          vec3 bmax = vec3(off + 0.9, floorY + fh, -depth + fz);
          float tf = boxHit(o, d, bmin, bmax, nrm);
          if (tf > 0.0 && tf < t) {
            vec3 fc = mix(vec3(0.42, 0.45, 0.50), vec3(0.72, 0.66, 0.58), h1(seed * 13.0));
            col = fc * (0.75 + 0.25 * nrm.y);
            lamp = 0.65;
            t = tf;
          }
          // cortina em parte das janelas
          if (h1(seed * 17.0) > 0.45) {
            float open = 0.25 + 0.35 * h1(seed * 19.0);
            float fold = 0.85 + 0.15 * sin(o.x * 38.0);
            float edge = smoothstep(open - 0.05, open, abs(o.x) / max(vRoom.x * 0.5, 0.01));
            col = mix(col, vec3(0.93, 0.90, 0.84) * fold, edge * 0.92);
            lamp = mix(lamp, 1.15, edge);
          }
          lightMask = lamp;
          // escurece com a profundidade (oclusão)
          return col * (0.62 + 0.38 * exp(-t * 0.18));
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float lightMask;
          vec3 room = roomColor(vRayO, normalize(vRayD), vSeed * 31.7 + 1.0, vRoom.w, vRoom.z, lightMask);
          float sold = vStatus > 1.5 ? 1.0 : 0.0;
          float res = vStatus > 0.5 && vStatus < 1.5 ? 1.0 : 0.0;
          float match = 1.0 - step(0.5, abs(vStatus - uFilter));
          float dim = uFilterOn * (1.0 - match) * 0.92;
          vec3 warm = mix(vec3(1.0, 0.60, 0.32), vec3(1.0, 0.76, 0.50), vSeed);
          float on = (sold + res) * uNight * (1.0 - dim);
          vec3 lampCol = res > 0.5 ? vec3(1.0, 0.66, 0.30) : warm;
          // dia: luz natural fraca dentro do cômodo; noite: luminária
          vec3 day = room * vec3(0.30, 0.31, 0.32) * (1.0 - uNight) * (1.0 - dim * 0.6);
          vec3 night = room * lampCol * lightMask * (0.75 + vSeed * 0.45) * on;
          vec3 dark = room * vec3(0.012, 0.016, 0.03) * uNight;
          vec3 inside = day + night + dark;
          float hov = 1.0 - step(0.5, abs(vUnit - uHover));
          float sel = 1.0 - step(0.5, abs(vUnit - uSelected));
          float pulse = 0.5 + 0.5 * sin(uTime * 3.2);
          inside += room * vec3(0.75, 0.92, 1.0) * (hov * 0.9 + sel * (0.8 + 0.6 * pulse)) * (0.5 + uNight * 0.7);
          totalEmissiveRadiance += inside;
        }`,
      )
  }
  m.customProgramCacheKey = () => 'kit-glass-interior'
  return m
}

const panelVert = /* glsl */ `
  attribute float aUnit;
  attribute float aStatus;
  attribute float aLevel;
  attribute vec2 aSize;
  varying vec2 vUv;
  varying float vUnit;
  varying float vStatus;
  varying float vLevel;
  varying vec2 vSize;
  void main() {
    vUv = uv;
    vUnit = aUnit;
    vStatus = aStatus;
    vLevel = aLevel;
    vSize = aSize;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`

/*
 * Painel de cada unidade na fachada: contorno e preenchimento na cor da situação. Fica transparente
 * até ligar o destaque, passar o mouse, selecionar ou filtrar.
 */
const panelFrag = /* glsl */ `
  uniform float uShow;
  uniform float uNight;
  uniform float uHover;
  uniform float uSelected;
  uniform float uTime;
  uniform float uReveal;
  uniform float uFilter;
  uniform float uFilterOn;
  uniform float uLevels;
  uniform vec3 uAvail;
  uniform vec3 uRes;
  uniform vec3 uSold;
  varying vec2 vUv;
  varying float vUnit;
  varying float vStatus;
  varying float vLevel;
  varying vec2 vSize;
  void main() {
    if (vUnit < 0.0) discard;
    vec2 p = vUv * vSize;
    float d = min(min(p.x, vSize.x - p.x), min(p.y, vSize.y - p.y));
    float edge = 1.0 - smoothstep(0.05, 0.11, d);
    bool avail = vStatus < 0.5;
    bool res = vStatus > 0.5 && vStatus < 1.5;
    vec3 col = avail ? uAvail : (res ? uRes : uSold);
    float match = 1.0 - step(0.5, abs(vStatus - uFilter));
    float lvl = vLevel / max(uLevels, 1.0);
    float rev = smoothstep(lvl, lvl + 0.12, uReveal * 1.12);
    // vendidas ficam só com o contorno, para o olho ir direto ao que está à venda
    float sold = (avail || res) ? 0.0 : 1.0;
    float show = max(uShow * rev * (1.0 - uFilterOn * (1.0 - match)), uFilterOn * match);
    float hov = 1.0 - step(0.5, abs(vUnit - uHover));
    float sel = 1.0 - step(0.5, abs(vUnit - uSelected));
    float pulse = 0.5 + 0.5 * sin(uTime * 3.2);
    float hl = max(hov, sel);
    vec3 c = mix(col, vec3(1.0, 0.98, 0.94), hl * 0.6);
    float fillA = show * mix(0.34, 0.16, uNight) * (1.0 - sold * 0.85) + hov * 0.22 + sel * (0.16 + 0.14 * pulse);
    float edgeA = max(show * (1.0 - sold * 0.45), hl);
    float veil = uFilterOn * (1.0 - match) * (1.0 - hl);
    float a = max(edge * edgeA, fillA);
    vec3 outc = c * mix(1.0, 1.45 + uNight * 0.8, edge);
    outc = mix(outc, vec3(0.02, 0.03, 0.06), veil * (1.0 - edge * edgeA));
    a = max(a, veil * mix(0.3, 0.55, uNight));
    if (a < 0.004) discard;
    gl_FragColor = vec4(outc, a);
  }
`

export function createPanelMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uShow: fx.uShow,
      uNight: fx.uNight,
      uHover: fx.uHover,
      uSelected: fx.uSelected,
      uTime: fx.uTime,
      uReveal: fx.uReveal,
      uFilter: fx.uFilter,
      uFilterOn: fx.uFilterOn,
      uLevels: fx.uLevels,
      uAvail: fx.uAvail,
      uRes: fx.uRes,
      uSold: fx.uSold,
    },
    vertexShader: panelVert,
    fragmentShader: panelFrag,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })
}

/** materiais com brilho próprio que muda entre dia e noite (a Atmosfera interpola a cada quadro) */
export const nightTuned: { m: THREE.MeshStandardMaterial; day: number; night: number }[] = []

/** reflexo do ambiente que muda entre dia e noite (vidros) */
export const envTuned: { m: THREE.MeshStandardMaterial; day: number; night: number }[] = []

export function tune(m: THREE.MeshStandardMaterial, day: number, night: number) {
  nightTuned.push({ m, day, night })
  return m
}

/** materiais cuja opacidade acompanha a noite (luzes da cidade, postes) */
export const fadeTuned: { m: THREE.Material & { opacity: number }; day: number; night: number }[] = []

export function fade<T extends THREE.Material & { opacity: number }>(m: T, day: number, night: number) {
  fadeTuned.push({ m, day, night })
  return m
}

let dot: THREE.CanvasTexture | null = null
/** textura redonda e suave para pontos de luz */
export function dotTexture() {
  if (dot) return dot
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  dot = new THREE.CanvasTexture(c)
  return dot
}

/** fachada genérica dos prédios vizinhos: janelas em grade, algumas acesas */
export function windowTextures(seed = 7) {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const W = 128
  const H = 512
  const day = document.createElement('canvas')
  const night = document.createElement('canvas')
  day.width = night.width = W
  day.height = night.height = H
  const d = day.getContext('2d')!
  const n = night.getContext('2d')!
  d.fillStyle = '#d9d6cf'
  d.fillRect(0, 0, W, H)
  n.fillStyle = '#000'
  n.fillRect(0, 0, W, H)
  const cols = 6
  const rows = 32
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 6 + (c * (W - 8)) / cols
      const y = 4 + (r * (H - 6)) / rows
      const w = (W - 8) / cols - 8
      const h = (H - 6) / rows - 7
      d.fillStyle = rnd() > 0.5 ? '#6f7f90' : '#5c6b7c'
      d.fillRect(x, y, w, h)
      if (rnd() < 0.34) {
        const warm = rnd()
        n.fillStyle = warm > 0.25 ? `rgb(255,${190 + Math.floor(rnd() * 40)},${110 + Math.floor(rnd() * 50)})` : 'rgb(200,225,255)'
        n.fillRect(x, y, w, h)
      }
    }
  }
  const mk = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 4
    return t
  }
  return { map: mk(day), emissive: mk(night) }
}

/**
 * Luz de fachada à noite: lavado quente embaixo (refletores do paisagismo) e um leve preenchimento
 * frio no alto. Só atua no modo noite.
 */
export function withWash<T extends THREE.MeshStandardMaterial>(m: T, k = 1) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = fx.uNight
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWY;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vWY = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).y;
        #else
          vWY = (modelMatrix * vec4(transformed, 1.0)).y;
        #endif`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying float vWY;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          float low = 1.0 - smoothstep(0.5, 17.0, vWY);
          vec3 wash = vec3(1.0, 0.70, 0.47) * 0.46 * low + vec3(0.62, 0.72, 0.92) * 0.16;
          totalEmissiveRadiance += diffuseColor.rgb * wash * uNight * ${k.toFixed(3)};
        }`,
      )
  }
  m.customProgramCacheKey = () => `wash-${k}`
  return m
}
