// Escenario 3D de la historia de F-2041 (OGL). Se carga bajo demanda, después del hero.
import { Renderer, Camera, Geometry, Program, Mesh, Texture, Plane, Box, Cylinder, Sphere, Torus, Transform, Vec3, Quat, Mat4 } from 'ogl';
import { buildAtlas, ATLAS_COLS, KIND } from './atlas';
import { SHEET_RATIO } from './constants';
import { buildScript, flags, DESK, type LabelSpec, type Anchor } from './script';
import { CH } from './chapters';
import { smooth, window01, clamp } from './keys';
import {
  paper,
  drawInvoice,
  drawSurveyBack,
  drawExcel,
  drawEnvelope,
  drawFlap,
  drawLetter,
  drawSlip,
  drawTax,
  drawSupplier,
  drawLedger,
  drawPrevious,
  type Paper,
} from './textures';
import { world } from './state';
import { SURVEY_URL } from '../../config';

const FOV = 30;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);
const PAPER_RGB = [0.961, 0.965, 0.953];
const INK_RGB = [0.078, 0.125, 0.106];
const SHEET_W = 1.6;
const SHEET_H = SHEET_W * SHEET_RATIO;

// ---------------------------------------------------------------- shaders

const WAVE = /* glsl */ `
float wave(vec2 q, float b, float t, float seed) {
  float w = 0.10 * sin(q.x * 2.6 + t * 2.1 + seed * 6.283)
          + 0.07 * sin(q.y * 2.2 + t * 1.6 + seed * 3.1)
          + 0.16 * q.x * q.x * sin(t * 1.3 + seed * 9.0)
          + 0.10 * q.y * q.y * cos(t * 1.1 + seed * 5.0);
  return w * b;
}`;

const FOG = /* glsl */ `
uniform vec3 uBg;
uniform vec2 uFog;
uniform float uAlpha;
uniform float uGray;
uniform float uDark;
vec3 finish(vec3 col, float depth) {
  col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), uGray);
  col *= mix(vec3(1.0), vec3(0.86, 0.9, 0.88), uDark * 0.6);
  col = mix(col, uBg, smoothstep(uFog.x, uFog.y, depth));
  return mix(uBg, col, uAlpha);
}`;

const sheetVertex = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uBend;
uniform float uSeed;
uniform vec2 uSize;
varying vec2 vUv;
varying vec3 vN;
varying float vDepth;
${WAVE}
void main() {
  vUv = uv;
  vec2 q = position.xy * 2.0;
  vec3 p = vec3(position.xy * uSize, wave(q, uBend, uTime, uSeed));
  float e = 0.02;
  float hx = (wave(q + vec2(e, 0.0), uBend, uTime, uSeed) - wave(q - vec2(e, 0.0), uBend, uTime, uSeed)) / (2.0 * e) / (uSize.x * 0.5);
  float hy = (wave(q + vec2(0.0, e), uBend, uTime, uSeed) - wave(q - vec2(0.0, e), uBend, uTime, uSeed)) / (2.0 * e) / (uSize.y * 0.5);
  vN = normalize(mat3(modelMatrix) * vec3(-hx, -hy, 1.0));
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const sheetFragment = /* glsl */ `
precision highp float;
uniform sampler2D tFront;
uniform sampler2D tBack;
uniform float uHasBack;
uniform float uAge;
uniform float uScan;
uniform float uGlow;
uniform vec3 uLight;
varying vec2 vUv;
varying vec3 vN;
varying float vDepth;
${FOG}
void main() {
  vec3 N = normalize(vN);
  vec3 col;
  if (gl_FrontFacing) {
    col = texture2D(tFront, vUv).rgb;
  } else {
    N = -N;
    vec2 buv = vec2(1.0 - vUv.x, vUv.y);
    col = uHasBack > 0.5 ? texture2D(tBack, buv).rgb : vec3(0.93, 0.94, 0.925) - (1.0 - texture2D(tFront, buv).rgb) * 0.05;
  }
  // Papel envejecido: amarillea, sobre todo hacia los bordes.
  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  vec3 aged = col * mix(vec3(0.93, 0.86, 0.68), vec3(0.98, 0.94, 0.82), smoothstep(0.0, 0.25, edge));
  col = mix(col, aged, uAge);
  // Línea del escáner y zona ya leída.
  if (uScan > -0.5) {
    float d = vUv.y - uScan;
    col = mix(col, col * vec3(0.9, 1.0, 0.95), step(0.0, d) * 0.35);
    col = mix(col, vec3(0.12, 0.42, 0.29), smoothstep(0.035, 0.0, abs(d)) * 0.75);
  }
  float diff = max(dot(N, normalize(uLight)), 0.0);
  float light = min(1.0, 0.8 + 0.26 * diff);
  light *= mix(0.86, 1.0, smoothstep(0.0, 0.012, edge));
  col *= light;
  col += vec3(0.12, 0.42, 0.29) * uGlow * smoothstep(0.03, 0.0, edge) * 0.8;
  gl_FragColor = vec4(finish(col, vDepth), 1.0);
}`;

const solidVertex = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
varying vec3 vN;
varying float vDepth;
void main() {
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const solidFragment = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uEmissive;
uniform vec3 uLight;
varying vec3 vN;
varying float vDepth;
${FOG}
void main() {
  vec3 N = normalize(vN);
  float diff = max(dot(N, normalize(uLight)), 0.0);
  float rim = pow(1.0 - abs(N.z), 2.0) * 0.12;
  vec3 col = uColor * (0.55 + 0.5 * diff) + rim + uEmissive;
  gl_FragColor = vec4(finish(col, vDepth), 1.0);
}`;

const crowdVertex = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec3 aOffset;
attribute vec3 aRot;
attribute vec4 aParams; // escala, ondulación, orden, tipo
attribute float aSeed;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform vec2 uSheet;
varying vec2 vUv;
varying vec3 vN;
varying float vClean;
varying float vKind;
varying float vDepth;
varying float vSeed;
${WAVE}
mat3 rot(vec3 r) {
  float cx = cos(r.x), sx = sin(r.x), cy = cos(r.y), sy = sin(r.y), cz = cos(r.z), sz = sin(r.z);
  mat3 X = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
  mat3 Y = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 Z = mat3(cz, sz, 0.0, -sz, cz, 0.0, 0.0, 0.0, 1.0);
  return X * Y * Z;
}
void main() {
  vUv = uv; vSeed = aSeed; vClean = aParams.z; vKind = aParams.w;
  float s = aParams.x;
  vec2 q = position.xy * 2.0;
  vec2 size = uSheet * s;
  vec3 p = vec3(position.xy * size, wave(q, aParams.y, uTime, aSeed) * s);
  mat3 R = rot(aRot);
  vN = R * vec3(0.0, 0.0, 1.0);
  vec4 mv = viewMatrix * vec4(R * p + aOffset, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const crowdFragment = /* glsl */ `
precision highp float;
uniform sampler2D tAtlas;
uniform vec2 uCell;
uniform float uCols;
uniform vec3 uLight;
varying vec2 vUv;
varying vec3 vN;
varying float vClean;
varying float vKind;
varying float vDepth;
varying float vSeed;
${FOG}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec4 cell(float idx, vec2 uv) {
  vec2 c = vec2(mod(idx, uCols), floor(idx / uCols + 0.001));
  uv = clamp(uv, 0.004, 0.996);
  return texture2D(tAtlas, vec2((c.x + uv.x) * uCell.x, 1.0 - (c.y + 1.0 - uv.y) * uCell.y));
}
void main() {
  float kind = floor(vKind + 0.5);
  float n = noise(vUv * vec2(7.0, 10.0) + vSeed * 17.0);
  float m = smoothstep(n - 0.07, n + 0.07, vClean * 1.16 - 0.08);
  vec4 tex = mix(cell(kind * 2.0, vUv), cell(kind * 2.0 + 1.0, vUv), m);
  if (tex.a < 0.5) discard;
  vec3 col = gl_FrontFacing ? tex.rgb : vec3(0.93, 0.94, 0.925);
  vec3 N = normalize(gl_FrontFacing ? vN : -vN);
  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  col *= min(1.0, 0.8 + 0.26 * max(dot(N, normalize(uLight)), 0.0)) * mix(0.86, 1.0, smoothstep(0.0, 0.015, edge));
  gl_FragColor = vec4(finish(col, vDepth), 1.0);
}`;

const beamFragment = /* glsl */ `
precision highp float;
uniform float uAlpha;
uniform float uTime;
varying vec2 vUv;
void main() {
  float h = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
  float w = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
  gl_FragColor = vec4(0.12, 0.62, 0.4, h * w * uAlpha * (0.6 + 0.4 * sin(vUv.x * 50.0 - uTime * 8.0)));
}`;
const beamVertex = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// ---------------------------------------------------------------- utilidades

const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const hex = (h: string) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export async function startStage(canvas: HTMLCanvasElement, labelsRoot: HTMLElement | null) {
  const mobile = world.mobile;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.75);
  const renderer = new Renderer({ canvas, dpr, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const gl = renderer.gl;
  gl.clearColor(PAPER_RGB[0], PAPER_RGB[1], PAPER_RGB[2], 1);
  const camera = new Camera(gl, { fov: FOV, near: 0.1, far: 80 });
  const scene = new Transform();
  const S = buildScript();

  // Uniformes comunes (niebla, fondo, gris, noche) compartidos por todos los materiales.
  const common = {
    uBg: { value: [...PAPER_RGB] },
    uFog: { value: [30, 60] },
    uAlpha: { value: 1 },
    uGray: { value: 0 },
    uDark: { value: 0 },
    uLight: { value: [-0.35, 0.65, 0.75] },
    uTime: { value: 0 },
  };

  // ---------- Hojas ----------
  const texPx = mobile ? 700 : 1100;
  const sheetGeo = new Plane(gl, { width: 1, height: 1, widthSegments: 16, heightSegments: 22 });
  type Sheet = { mesh: Mesh; uniforms: Record<string, { value: unknown }>; front: Paper; tex: Texture; w: number; h: number; back?: Paper; backTex?: Texture };
  const makeTex = (p: Paper) => new Texture(gl, { image: p.canvas, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, anisotropy: 8 });
  const sheets: Record<string, Sheet> = {};
  const addSheet = (name: string, front: Paper, w: number, h: number, back?: Paper, parent: Transform = scene) => {
    const tex = makeTex(front);
    const backTex = back ? makeTex(back) : tex;
    const uniforms = {
      ...common,
      tFront: { value: tex },
      tBack: { value: backTex },
      uHasBack: { value: back ? 1 : 0 },
      uAge: { value: 0 },
      uScan: { value: -1 },
      uGlow: { value: 0 },
      uBend: { value: 0 },
      uSeed: { value: Math.random() },
      uSize: { value: [w, h] },
      // Opacidad propia (para aparecer y desaparecer), independiente del resto.
      uAlpha: { value: 1 },
    };
    const program = new Program(gl, { vertex: sheetVertex, fragment: sheetFragment, uniforms, cullFace: null });
    const mesh = new Mesh(gl, { geometry: sheetGeo, program, frustumCulled: false });
    mesh.rotation.reorder('XYZ');
    mesh.setParent(parent);
    sheets[name] = { mesh, uniforms, front, tex, w, h, back, backTex };
    return sheets[name];
  };

  const A4 = (): Paper => paper(340, 481, texPx);
  const invFront = A4();
  const invBack = A4();
  const inv = addSheet('inv', invFront, SHEET_W, SHEET_H, invBack);
  const excel = addSheet('excel', A4(), SHEET_W, SHEET_H);
  const tax = addSheet('tax', A4(), SHEET_W, SHEET_H);
  const sup = addSheet('sup', A4(), SHEET_W, SHEET_H);
  const p1 = addSheet('p1', A4(), SHEET_W, SHEET_H);
  const p2 = addSheet('p2', A4(), SHEET_W, SHEET_H);
  await nextFrame();
  drawPrevious(p1.front, 40);
  drawPrevious(p2.front, 39);
  const letters = [0, 1, 2].map((i) => {
    const pp = paper(340, 240, texPx * 0.6);
    drawLetter(pp, i);
    return addSheet(`letter${i}`, pp, 1.0, 1.0 * (240 / 340));
  });
  await nextFrame();
  const slipP = paper(340, 150, texPx * 0.7);
  drawSlip(slipP);
  const slip = addSheet('slip', slipP, 1.5, 1.5 * (150 / 340));

  // Sobre: cuerpo + solapa triangular con bisagra arriba.
  const envGroup = new Transform();
  envGroup.rotation.reorder('XYZ');
  envGroup.setParent(scene);
  const envP = paper(340, 220, texPx * 0.7);
  drawEnvelope(envP);
  const envW = 1.8;
  const envH = envW * (220 / 340);
  const envBody = addSheet('env', envP, envW, envH, undefined, envGroup);
  const flapPivot = new Transform();
  flapPivot.position.set(0, envH / 2, 0.004);
  flapPivot.setParent(envGroup);
  const flapP = paper(100, 100, 128);
  drawFlap(flapP);
  const flapGeo = new Geometry(gl, {
    position: { size: 3, data: new Float32Array([-envW / 2, 0, 0, envW / 2, 0, 0, 0, -envH * 0.62, 0]) },
    uv: { size: 2, data: new Float32Array([0, 1, 1, 1, 0.5, 0]) },
  });
  const flapUniforms = { ...common, tFront: { value: makeTex(flapP) }, tBack: { value: null as unknown }, uHasBack: { value: 0 }, uAge: { value: 0 }, uScan: { value: -1 }, uGlow: { value: 0 }, uBend: { value: 0 }, uSeed: { value: 0 }, uSize: { value: [1, 1] } };
  flapUniforms.tBack.value = flapUniforms.tFront.value;
  const flap = new Mesh(gl, { geometry: flapGeo, program: new Program(gl, { vertex: sheetVertex.replace('position.xy * uSize', 'position.xy'), fragment: sheetFragment, uniforms: flapUniforms, cullFace: null }), frustumCulled: false });
  flap.setParent(flapPivot);

  await nextFrame();
  // ---------- Sólidos ----------
  const solid = (geometry: Geometry, color: string, parent: Transform = scene) => {
    const uniforms = { ...common, uColor: { value: hex(color) }, uEmissive: { value: [0, 0, 0] } };
    const mesh = new Mesh(gl, { geometry, program: new Program(gl, { vertex: solidVertex, fragment: solidFragment, uniforms }), frustumCulled: false });
    mesh.setParent(parent);
    return { mesh, uniforms };
  };

  // Sello de caucho: mango de madera, base y goma (roja o verde según el sello).
  const stampGroup = new Transform();
  stampGroup.setParent(scene);
  const handle = solid(new Cylinder(gl, { radiusTop: 0.075, radiusBottom: 0.1, height: 0.42, radialSegments: 20 }), '#6b4f3a', stampGroup);
  handle.mesh.position.y = 0.42;
  const knob = solid(new Sphere(gl, { radius: 0.12, widthSegments: 20, heightSegments: 14 }), '#7a5b43', stampGroup);
  knob.mesh.position.y = 0.66;
  const base = solid(new Box(gl, { width: 0.72, height: 0.12, depth: 0.42 }), '#1c2a24', stampGroup);
  base.mesh.position.y = 0.12;
  const rubber = solid(new Box(gl, { width: 0.68, height: 0.05, depth: 0.38 }), '#c8372d', stampGroup);
  rubber.mesh.position.y = 0.035;

  // Libro mayor.
  const bookGroup = new Transform();
  bookGroup.rotation.reorder('XYZ');
  bookGroup.setParent(scene);
  const pageW = 1.2;
  const pageH = 1.6;
  solid(new Box(gl, { width: pageW + 0.04, height: pageH + 0.06, depth: 0.03 }), '#1f6b4a', bookGroup).mesh.position.set(pageW / 2, 0, -0.08);
  solid(new Box(gl, { width: pageW, height: pageH, depth: 0.12 }), '#efede4', bookGroup).mesh.position.set(pageW / 2, 0, 0);
  const ledgerR = paper(340, 453, texPx * 0.8);
  const right = addSheet('ledger', ledgerR, pageW - 0.04, pageH - 0.04, undefined, bookGroup);
  right.mesh.position.set(pageW / 2, 0, 0.062);
  const coverPivot = new Transform();
  coverPivot.position.set(0, 0, 0.075);
  coverPivot.setParent(bookGroup);
  solid(new Box(gl, { width: pageW + 0.04, height: pageH + 0.06, depth: 0.03 }), '#1f6b4a', coverPivot).mesh.position.set(pageW / 2, 0, 0);
  const ledgerL = paper(340, 453, texPx * 0.6);
  drawLedger(ledgerL, 'left', false);
  const left = addSheet('ledgerL', ledgerL, pageW - 0.04, pageH - 0.04, undefined, coverPivot);
  left.mesh.position.set(pageW / 2, 0, -0.018);
  left.mesh.rotation.y = Math.PI;

  // Barras de caja (13 semanas ≈ 90 días).
  const cash = [30, 33, 31, 35, 32, 27, 21, 13, 19, 26, 30, 33, 36];
  const barGroup = new Transform();
  barGroup.setParent(scene);
  const barGeo = new Box(gl, { width: 0.12, height: 1, depth: 0.12 });
  const barMeshes = cash.map((_, i) => {
    const b = solid(barGeo, '#1f6b4a', barGroup);
    b.mesh.position.x = (i - 6) * 0.17;
    return b;
  });

  // Cadena de Verifactu: tres eslabones entre cada par de facturas.
  const linkGeo = new Torus(gl, { radius: 0.11, tube: 0.03, radialSegments: 10, tubularSegments: 28 });
  const linkMeshes = Array.from({ length: 6 }, () => solid(linkGeo, '#8fd3b2'));

  // Carretera de la hoja de ruta.
  const roadGroup = new Transform();
  roadGroup.setParent(scene);
  const ground = solid(new Box(gl, { width: 0.9, height: 0.02, depth: 16 }), '#dfe4dd', roadGroup);
  ground.mesh.position.set(0, -0.95, -6.5);
  const markers = [0, 1, 2, 3].map((i) => {
    const g = new Transform();
    g.position.set([0, 0.45, -0.4, 0.3][i], -0.95, [-0.3, -3.6, -6.9, -10.2][i]);
    g.setParent(roadGroup);
    solid(new Cylinder(gl, { radiusTop: 0.025, radiusBottom: 0.025, height: 0.6 }), '#14201b', g).mesh.position.y = 0.3;
    const disc = solid(new Cylinder(gl, { radiusTop: 0.2, radiusBottom: 0.2, height: 0.05, radialSegments: 28 }), i === 0 ? '#1f6b4a' : '#c9d0c9', g);
    disc.mesh.position.y = 0.62;
    return { g, disc };
  });

  // Haz del escáner.
  const beamUniforms = { uAlpha: { value: 0 }, uTime: { value: 0 } };
  const beam = new Mesh(gl, {
    geometry: new Plane(gl, { width: 1, height: 1 }),
    program: new Program(gl, { vertex: beamVertex, fragment: beamFragment, uniforms: beamUniforms, transparent: true, depthWrite: false, cullFace: null }),
    frustumCulled: false,
  });
  beam.setParent(scene);

  // ---------- Multitud de facturas (instancias) ----------
  await nextFrame();
  const atlas = await buildAtlas(1024);
  const N = mobile ? 34 : 80;
  const offsets = new Float32Array(N * 3);
  const rots = new Float32Array(N * 3);
  const params = new Float32Array(N * 4);
  const seeds = new Float32Array(N).map(() => Math.random());
  const crowdKinds = Array.from({ length: N }, (_, i) => [KIND.invoiceA, KIND.invoiceB, KIND.reminder, KIND.invoiceB, KIND.sheet, KIND.supplier, KIND.bank][i % 7]);
  const crowdGeo = new Geometry(gl, {
    position: sheetGeo.attributes.position,
    uv: sheetGeo.attributes.uv,
    index: sheetGeo.attributes.index,
    aOffset: { instanced: 1, size: 3, data: offsets },
    aRot: { instanced: 1, size: 3, data: rots },
    aParams: { instanced: 1, size: 4, data: params },
    aSeed: { instanced: 1, size: 1, data: seeds },
  });
  const crowdUniforms = {
    ...common,
    tAtlas: { value: new Texture(gl, { image: atlas.canvas, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, anisotropy: 8 }) },
    uCell: { value: [atlas.cellW, atlas.cellH] },
    uCols: { value: ATLAS_COLS },
    uSheet: { value: [SHEET_W, SHEET_H] },
  };
  const crowd = new Mesh(gl, { geometry: crowdGeo, program: new Program(gl, { vertex: crowdVertex, fragment: crowdFragment, uniforms: crowdUniforms, cullFace: null }), frustumCulled: false });
  crowd.setParent(scene);

  // ---------- Etiquetas (DOM ancladas a puntos de los objetos) ----------
  type LabelEl = { spec: LabelSpec; el: HTMLElement; box: HTMLElement; line: HTMLElement; text: string };
  const labelEls: LabelEl[] = [];
  if (labelsRoot) {
    labelsRoot.textContent = '';
    for (const spec of S.labels) {
      if (spec.desktop && mobile) continue;
      const el = document.createElement('div');
      el.className = `wl wl-${spec.style ?? 'pill'}${spec.tone ? ` wl-${spec.tone}` : ''}`;
      const line = document.createElement('span');
      line.className = 'wl-line';
      const dot = document.createElement('span');
      dot.className = 'wl-dot';
      const box = document.createElement('span');
      box.className = 'wl-box';
      el.append(line, dot, box);
      labelsRoot.append(el);
      labelEls.push({ spec, el, box, line, text: '' });
    }
  }

  // Enlace invisible sobre la hoja de la encuesta (el botón accesible está en el texto).
  const surveyLink = document.createElement('a');
  surveyLink.href = SURVEY_URL;
  surveyLink.target = '_blank';
  surveyLink.rel = 'noopener';
  surveyLink.className = 'world-survey-link';
  surveyLink.tabIndex = -1;
  surveyLink.setAttribute('aria-hidden', 'true');
  document.body.append(surveyLink);

  // ---------- Tamaño y encuadre ----------
  let aspect = 1;
  // Desplazamiento de lente: la acción ocurre a la derecha (escritorio) o arriba (móvil),
  // y el texto ocupa el otro lado.
  let shift = [0, 0];
  let zoom = 1;
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    aspect = window.innerWidth / window.innerHeight;
    camera.perspective({ aspect });
    const narrow = window.innerWidth < 1024;
    shift = mobile ? [0, 0.4] : narrow ? [0.3, 0] : [0.42, 0];
    zoom = mobile ? Math.max(1.6, 0.95 / aspect) : narrow ? 1.25 : 1;
  };
  resize();
  window.addEventListener('resize', resize);

  // ---------- Interacción ----------
  const projView = new Mat4();
  /** Punto 3D → píxeles de pantalla. El tercer valor es w (≤ 0: detrás de la cámara). */
  const toScreen = (v: Vec3) => {
    const m = projView;
    const x = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
    const y = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
    const w = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15];
    return [((x / w) * 0.5 + 0.5) * window.innerWidth, (-(y / w) * 0.5 + 0.5) * window.innerHeight, w];
  };
  const worldPoint = (s: Sheet, u: number, vTop: number, out = new Vec3()) =>
    out.set((u - 0.5) * s.w, (0.5 - vTop) * s.h, 0).applyMatrix4(s.mesh.worldMatrix);
  /** Cuadrilátero en pantalla de una hoja (para saber si el puntero está encima). */
  const quad = (s: Sheet) => [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].map(([u, v]) => toScreen(worldPoint(s, u, v)));
  const inside = (pts: number[][], x: number, y: number) => {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-6) + xi) c = !c;
    }
    return c;
  };

  const drag = { active: false, lastX: 0, vel: 0, ry: 0, rx: 0 };
  let hovering = false;
  let invQuad: number[][] = [];
  const onMove = (e: PointerEvent) => {
    world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    world.pointer.active = e.pointerType === 'mouse';
    if (drag.active) {
      const dx = e.clientX - drag.lastX;
      drag.lastX = e.clientX;
      drag.ry += dx * 0.012;
      drag.vel = dx * 0.012;
    }
    hovering = invQuad.length > 0 && inside(invQuad, e.clientX, e.clientY);
  };
  const canGrab = () => world.T < 0.75;
  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button, input, select, textarea, label')) return;
    if (!invQuad.length || !inside(invQuad, e.clientX, e.clientY)) return;
    if (canGrab()) {
      drag.active = true;
      drag.lastX = e.clientX;
      drag.vel = 0;
      document.documentElement.classList.add('world-grabbing');
    } else if (world.T >= CH.tesoreria + 0.15 && world.T < CH.tesoreria + 0.56) {
      world.user.stamped = true;
      world.user.stampAt = performance.now();
    }
  };
  const onUp = () => {
    drag.active = false;
    document.documentElement.classList.remove('world-grabbing');
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  // ---------- Estado de las texturas ----------
  const texKeys: Record<string, string> = {};
  let lastExcel = -1;
  const redraw = (T: number, blink: boolean) => {
    const f = flags(T, world.user);
    // Cada textura se redibuja solo si cambia su estado, y como mucho dos por fotograma.
    const jobs: [string, string, () => void][] = [
      ['inv', `${f.overdue}${f.paid}${f.qr}`, () => {
        drawInvoice(inv.front, { overdue: f.overdue, paid: f.paid, qr: f.qr });
        inv.tex.needsUpdate = true;
      }],
      ['back', `${f.surveyTicks}`, () => {
        drawSurveyBack(inv.back!, f.surveyTicks);
        inv.backTex!.needsUpdate = true;
      }],
      ['tax', `${f.filled}${f.draft}`, () => {
        drawTax(tax.front, f.filled, f.draft);
        tax.tex.needsUpdate = true;
      }],
      ['sup', `${f.supRead}${f.approved}`, () => {
        drawSupplier(sup.front, f.supRead, f.approved);
        sup.tex.needsUpdate = true;
      }],
      ['ledger', `${f.entry}`, () => {
        drawLedger(right.front, 'right', f.entry);
        right.tex.needsUpdate = true;
      }],
    ];
    let budget = 2;
    for (const [name, k, run] of jobs) {
      if (budget > 0 && texKeys[name] !== k) {
        texKeys[name] = k;
        run();
        budget--;
      }
    }
    const typed = Math.round(S.excel.at('typed', T) * 200) / 200;
    const ex = typed * 1000 + (blink ? 1 : 0);
    if (ex !== lastExcel && S.excel.at('vis', T) > 0.01) {
      lastExcel = ex;
      drawExcel(excel.front, typed, blink && typed < 1);
      excel.tex.needsUpdate = true;
    }
    return f;
  };
  [p1, p2, letters[0], letters[1], letters[2], slip, envBody].forEach((s) => (s.tex.needsUpdate = true));
  drawLedger(left.front, 'left', false);

  // ---------- Aplicar un actor de hoja ----------
  const applySheet = (s: Sheet, v: Record<string, number>, extra = { rx: 0, ry: 0, rz: 0, z: 0 }) => {
    const visible = v.vis > 0.005;
    s.mesh.visible = visible;
    if (!visible) return;
    const k = 0.35 + 0.65 * v.vis;
    s.mesh.position.set(v.x, v.y, v.z + extra.z);
    s.mesh.rotation.set(v.rx + extra.rx, v.ry + extra.ry, v.rz + extra.rz);
    s.mesh.scale.set(v.s * k, v.s * k, v.s * k);
    s.uniforms.uBend.value = v.bend ?? 0.04;
    s.uniforms.uAlpha.value = Math.min(1, v.vis * 1.5) * fade;
  };

  // ---------- Pose de la multitud ----------
  const crowdPose = (i: number, t: number, c: Record<string, number>, size: 'small' | 'medium' | null, T: number) => {
    // Fondo: deriva lejana
    let x = (rnd(i, 1) - 0.5) * 13 + Math.sin(t * 0.08 + i) * 0.4;
    let y = (rnd(i, 2) - 0.5) * 7 + Math.cos(t * 0.07 + i * 2) * 0.3;
    let z = -6 - rnd(i, 3) * 9;
    let rx = (rnd(i, 4) - 0.5) * 1.6 + t * 0.04 * (rnd(i, 5) - 0.5);
    let ry = (rnd(i, 6) - 0.5) * 2 + t * 0.05 * (rnd(i, 7) - 0.5);
    let rz = (rnd(i, 8) - 0.5) * 1.5;
    let s = 1;
    let bend = 0.3;
    // Montón sobre la mesa, enterrando a F-2041
    const pw = clamp(c.pile * 1.5 - rnd(i, 9) * 0.5);
    if (pw > 0) {
      const a = rnd(i, 10) * Math.PI * 2;
      const r = 0.55 + rnd(i, 11) * 1.7;
      const px = Math.cos(a) * r * 1.2;
      const pz = Math.sin(a) * r * 0.75 + 0.05;
      const py = DESK + 0.01 + i * 0.0022;
      const lift = Math.sin(Math.PI * pw) * 1.4;
      const e = pw * pw * (3 - 2 * pw);
      x += (px - x) * e;
      y += (py - y) * e + lift;
      z += (pz - z) * e;
      rx += (-Math.PI / 2 - rx) * e;
      ry += (0 - ry) * e;
      rz += ((rnd(i, 12) - 0.5) * 1.4 - rz) * e;
      s += (0.74 - s) * e;
      bend += (0.02 - bend) * e;
    }
    // Corriente de 200 facturas (empresa mediana)
    const want = size === null ? c.stream : size === 'medium' && T > CH.audience && T < CH.roadmap ? 1 : 0;
    const sw = clamp(want * 1.4 - rnd(i, 13) * 0.4);
    if (sw > 0) {
      const u = (rnd(i, 14) + t * 0.05) % 1;
      const sx = (u * 2 - 1) * 4.2;
      const sy = (rnd(i, 15) - 0.5) * 1.6;
      const sz = -1.4 - rnd(i, 16) * 1.6;
      const e = sw * sw * (3 - 2 * sw);
      x += (sx - x) * e;
      y += (sy - y) * e;
      z += (sz - z) * e;
      rx += (-0.15 - rx) * e;
      ry += (0.35 - ry) * e;
      rz += ((rnd(i, 17) - 0.5) * 0.2 - rz) * e;
      s += (0.42 - s) * e;
      bend += (0.1 - bend) * e;
    }
    return { x, y, z, rx, ry, rz, s, bend };
  };

  // ---------- Bucle ----------
  let time = 0;
  let flutter = 0;
  let lastNow = performance.now();
  let raf = 0;
  let fade = 0;
  const bg = [...PAPER_RGB];
  let lastCss = '';
  const camPos = new Vec3();
  const camTarget = new Vec3();
  const up = new Vec3(0, 1, 0);
  const qtmp = new Quat();
  const nrm = new Vec3();
  const p0 = new Vec3();
  const p1v = new Vec3();

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(Math.max((now - lastNow) / 1000, 0), 1 / 20);
    lastNow = now;
    if (document.hidden) return;
    time += dt;

    // T sigue al scroll con un poco de inercia.
    world.T += (world.target - world.T) * (1 - Math.exp(-dt * 5));
    if (!Number.isFinite(world.T) || world.T < 0) world.T = Math.max(0, world.target || 0);
    const T = world.T;

    const fx = S.fx.eval(T);
    flutter += dt * (1 - fx.freeze);
    common.uTime.value = flutter;
    const f = redraw(T, Math.floor(time * 2.2) % 2 === 0);

    // Cámara
    const c = S.cam.eval(T);
    const px = world.pointer.active && T < CH.cobros ? world.pointer.x : 0;
    const py = world.pointer.active && T < CH.cobros ? world.pointer.y : 0;
    camTarget.set(c.tx, c.ty, c.tz);
    camPos.set(c.x + px * 0.25, c.y + py * 0.15, c.z).sub(camTarget).multiply(zoom).add(camTarget);
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    camera.projectionMatrix[8] = -shift[0];
    camera.projectionMatrix[9] = -shift[1];

    // Protagonista
    const iv = S.inv.eval(T);
    if (!drag.active) {
      drag.ry += drag.vel;
      drag.vel *= Math.exp(-dt * 3);
      const home = Math.round(drag.ry / (Math.PI * 2)) * Math.PI * 2;
      if (Math.abs(drag.vel) < 0.002) drag.ry += (home - drag.ry) * (1 - Math.exp(-dt * (T < 0.75 ? 1.2 : 6)));
    }
    const tilt = T < 0.6 ? 1 - T / 0.6 : 0;
    const shake = world.user.tamperAt ? Math.max(0, 1 - (now - world.user.tamperAt) / 700) : 0;
    const hoverSurvey = hovering && T > CH.survey + 0.35 && T < CH.end ? 1 : 0;
    world.hoverLift += (hoverSurvey - world.hoverLift) * (1 - Math.exp(-dt * 8));
    applySheet(inv, iv, {
      rx: -py * 0.25 * tilt + Math.sin(time * 0.9) * 0.03 * tilt,
      ry: drag.ry + px * 0.35 * tilt,
      rz: Math.sin(now * 0.06) * 0.05 * shake,
      z: world.hoverLift * 0.25,
    });
    inv.mesh.position.x += Math.sin(now * 0.07) * 0.06 * shake;
    inv.uniforms.uAge.value = iv.age;
    inv.uniforms.uScan.value = iv.scan;
    inv.uniforms.uGlow.value = Math.max(world.hoverLift, shake, hovering && T < 0.75 ? 0.6 : 0);
    document.documentElement.classList.toggle('world-can-grab', hovering && (T < 0.75 || T > CH.survey + 0.35));

    applySheet(excel, S.excel.eval(T));
    letters.forEach((l, i) => applySheet(l, S.letters[i].eval(T)));
    applySheet(slip, S.slip.eval(T));
    applySheet(tax, S.tax.eval(T));
    const sv = S.sup.eval(T);
    applySheet(sup, sv);
    sup.uniforms.uScan.value = sv.scan;
    applySheet(p1, S.p1.eval(T));
    applySheet(p2, S.p2.eval(T));

    // Sobre
    const ev = S.env.eval(T);
    envGroup.visible = ev.vis > 0.005;
    if (envGroup.visible) {
      envGroup.position.set(ev.x, ev.y, ev.z);
      envGroup.rotation.set(ev.rx, ev.ry, ev.rz);
      const k = (0.35 + 0.65 * ev.vis) * ev.s;
      envGroup.scale.set(k, k, k);
      envBody.mesh.position.set(0, 0, 0);
      envBody.mesh.rotation.set(0, 0, 0);
      envBody.mesh.scale.set(1, 1, 1);
      envBody.mesh.visible = true;
      flapPivot.rotation.x = -Math.PI * ev.flap * 0.94;
    }

    // Libro
    const bv = S.book.eval(T);
    bookGroup.visible = bv.vis > 0.005;
    if (bookGroup.visible) {
      bookGroup.position.set(bv.x - pageW / 2 + pageW * (1 - bv.open) * 0.5, bv.y, bv.z);
      bookGroup.rotation.set(bv.rx, bv.ry, 0);
      const k = (0.35 + 0.65 * bv.vis) * bv.s;
      bookGroup.scale.set(k, k, k);
      coverPivot.rotation.y = -Math.PI * bv.open;
      left.mesh.visible = bv.open > 0.5;
    }

    // Barras de caja: fantasmas con interrogantes, o previsión real
    const bars = S.bars.eval(T);
    barGroup.visible = bars.vis > 0.005;
    if (barGroup.visible) {
      barGroup.position.set(bars.x, bars.y, bars.z);
      barMeshes.forEach((b, i) => {
        const ghost = 0.55 + 0.45 * Math.sin(flutter * 1.7 + i * 1.3) * Math.sin(flutter * 0.9 + i);
        const real = cash[i] / 36 + (i === 0 ? bars.lift * 0.12 : 0);
        const h = Math.max(0.02, (ghost * (1 - bars.known) + real * bars.known) * 1.6 * bars.vis);
        b.mesh.scale.y = h;
        b.mesh.position.y = h / 2;
        const color = bars.known > 0.5 ? (i === 7 ? hex('#c8372d') : i === 0 && bars.lift > 0.5 ? hex('#2a8a61') : hex('#1f6b4a')) : hex('#b8c0ba');
        b.uniforms.uColor.value = color;
      });
    }

    // Eslabones de la cadena entre F-2039 → F-2040 → F-2041
    const lk = S.links.eval(T).vis;
    linkMeshes.forEach((m, i) => {
      m.mesh.visible = lk > 0.01;
      if (!m.mesh.visible) return;
      const [a, b] = i < 3 ? [p2, p1] : [p1, inv];
      worldPoint(a, 1, 0.5, p0);
      worldPoint(b, 0, 0.5, p1v);
      const k = (i % 3) + 1;
      const t = k / 4;
      m.mesh.position.set(p0[0] + (p1v[0] - p0[0]) * t, p0[1] + (p1v[1] - p0[1]) * t, p0[2] + (p1v[2] - p0[2]) * t);
      m.mesh.rotation.set(k % 2 ? 0 : Math.PI / 2, 0.3, 0);
      const sc = clamp(lk * 3 - (i % 3) * 0.6);
      m.mesh.scale.set(sc, sc, sc);
    });

    // Carretera
    const rd = S.road.eval(T).vis;
    roadGroup.visible = rd > 0.01;
    roadGroup.scale.set(1, rd, 1);
    markers.forEach((m, i) => (m.disc.uniforms.uEmissive.value = i === 0 ? [0.05 + 0.08 * Math.sin(time * 3) ** 2, 0.12, 0.08] : [0, 0, 0]));

    // Sello
    const st = S.stamp.eval(T);
    let press = st.press;
    let svis = st.vis;
    // Si el usuario estampa antes de tiempo, el sello baja ahora.
    if (world.user.stampAt && T < CH.tesoreria + 0.56) {
      const k = (now - world.user.stampAt) / 600;
      if (k < 1) {
        svis = Math.max(svis, Math.sin(Math.PI * k));
        press = Math.max(press, k < 0.5 ? (k / 0.5) ** 4 : 1 - (k - 0.5) / 0.5);
      }
    }
    if (world.user.approveAt && T < CH.proveedores + 0.72) {
      const k = (now - world.user.approveAt) / 600;
      if (k < 1) {
        svis = Math.max(svis, Math.sin(Math.PI * k));
        press = Math.max(press, k < 0.5 ? (k / 0.5) ** 4 : 1 - (k - 0.5) / 0.5);
      }
    }
    stampGroup.visible = svis > 0.01;
    if (stampGroup.visible) {
      const userTarget = world.user.approveAt && T > CH.proveedores && T < CH.verifactu ? 2 : null;
      const target = [inv, tax, sup][userTarget ?? Math.round(st.target)];
      target.mesh.updateMatrixWorld();
      worldPoint(target, st.u, st.v, p0);
      nrm.set(0, 0, 1).applyQuaternion(target.mesh.quaternion).normalize();
      const lift = 0.004 + (1 - press) * 0.9;
      stampGroup.position.set(p0[0] + nrm[0] * lift, p0[1] + nrm[1] * lift, p0[2] + nrm[2] * lift);
      // El eje del sello (y local) apunta en la normal del papel.
      const dot = clamp(up.dot(nrm), -1, 1);
      const axis = new Vec3().cross(up, nrm);
      if (axis.len() < 1e-5) axis.set(1, 0, 0);
      qtmp.fromAxisAngle(axis.normalize(), Math.acos(dot));
      stampGroup.quaternion.copy(qtmp);
      const sc = (0.4 + 0.6 * svis) * (target === inv ? 0.62 + 0.38 * clamp(target.mesh.scale[0] / 0.7) : 0.75);
      stampGroup.scale.set(sc, sc, sc);
      rubber.uniforms.uColor.value = st.ink > 0.5 ? hex('#1f6b4a') : hex('#c8372d');
    }

    // Haz del escáner sobre la hoja que se está leyendo
    const scanning = iv.scan > -0.5 ? inv : sv.scan > -0.5 ? sup : null;
    beamUniforms.uAlpha.value = scanning ? 1 : 0;
    beam.visible = !!scanning;
    if (scanning) {
      const v = scanning === inv ? iv.scan : sv.scan;
      worldPoint(scanning, 0.5, 1 - v, p0);
      beam.position.copy(p0);
      beam.position.z += 0.02;
      beam.quaternion.copy(scanning.mesh.quaternion);
      beam.scale.set(scanning.w * scanning.mesh.scale[0] * 1.25, 0.16, 1);
      beamUniforms.uTime.value = time;
    }

    // Multitud
    const cv = { ...S.crowd.eval(T) };
    const size = world.user.size;
    // Si el usuario elige el tamaño, la escena le hace caso al momento.
    if (size && T > CH.audience && T < CH.roadmap) cv.vis = size === 'medium' ? 1 : 0;
    crowd.visible = cv.vis > 0.01;
    if (crowd.visible) {
      for (let i = 0; i < N; i++) {
        const p = crowdPose(i, flutter, cv, size, T);
        offsets[i * 3] = p.x;
        offsets[i * 3 + 1] = p.y;
        offsets[i * 3 + 2] = p.z;
        rots[i * 3] = p.rx;
        rots[i * 3 + 1] = p.ry;
        rots[i * 3 + 2] = p.rz;
        params[i * 4] = p.s * (0.4 + 0.6 * cv.vis);
        params[i * 4 + 1] = p.bend;
        params[i * 4 + 2] = cv.clean;
        params[i * 4 + 3] = crowdKinds[i];
      }
      crowdGeo.attributes.aOffset.needsUpdate = true;
      crowdGeo.attributes.aRot.needsUpdate = true;
      crowdGeo.attributes.aParams.needsUpdate = true;
    }

    // Fondo: papel de día, tinta de noche (Verifactu)
    const target = fx.dark > 0.5 ? INK_RGB : PAPER_RGB;
    for (let k = 0; k < 3; k++) bg[k] += (target[k] - bg[k]) * (1 - Math.exp(-dt * 4));
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    common.uBg.value = bg;
    common.uDark.value = (bg[0] - PAPER_RGB[0]) / (INK_RGB[0] - PAPER_RGB[0]);
    common.uGray.value = fx.gray;
    common.uFog.value = [(30 - fx.fog * 25) * zoom, (60 - fx.fog * 49) * zoom];
    fade += (1 - fade) * (1 - Math.exp(-dt * 2.5));
    common.uAlpha.value = fade;
    const css = `rgb(${Math.round(bg[0] * 255)} ${Math.round(bg[1] * 255)} ${Math.round(bg[2] * 255)})`;
    if (css !== lastCss) {
      lastCss = css;
      document.documentElement.style.setProperty('--world-bg', css);
    }

    renderer.render({ scene, camera });
    projView.multiply(camera.projectionMatrix, camera.viewMatrix);

    // Después de dibujar (matrices al día): etiquetas, enlace de la encuesta y zona del puntero.
    invQuad = inv.mesh.visible ? quad(inv) : [];
    updateLabels(T, f);
    const surveyOn = T > CH.survey + 0.35 && T < CH.end && invQuad.length;
    surveyLink.style.display = surveyOn ? 'block' : 'none';
    if (surveyOn) {
      const xs = invQuad.map((p) => p[0]);
      const ys = invQuad.map((p) => p[1]);
      const l = Math.min(...xs);
      const tp = Math.min(...ys);
      surveyLink.style.transform = `translate(${l}px, ${tp}px)`;
      surveyLink.style.width = `${Math.max(...xs) - l}px`;
      surveyLink.style.height = `${Math.max(...ys) - tp}px`;
    }
  };

  const anchorPoint = (a: Anchor, T: number, out: Vec3): boolean => {
    const sheetOf = (name: string) => sheets[name];
    if ('actor' in a) {
      if (a.actor === 'book') {
        if (!bookGroup.visible) return false;
        out.set(pageW * 0.5, pageH * 0.5 + 0.1, 0).applyMatrix4(bookGroup.worldMatrix);
        return true;
      }
      const s = sheetOf(a.actor);
      if (!s) return false;
      let visible = s.mesh.visible;
      let p: Transform | null = s.mesh.parent;
      while (visible && p) {
        visible = p.visible;
        p = p.parent;
      }
      if (!visible) return false;
      worldPoint(s, a.uv[0], a.uv[1], out);
      return true;
    }
    if ('world' in a) {
      out.set(a.world[0], a.world[1], a.world[2]);
      return true;
    }
    if ('bar' in a) {
      if (!barGroup.visible) return false;
      if (a.bar < 0) out.set(0, 1.8, 0).applyMatrix4(barGroup.worldMatrix);
      else {
        const m = barMeshes[a.bar].mesh;
        out.set(0, 0.5, 0).applyMatrix4(m.worldMatrix);
      }
      return true;
    }
    if ('marker' in a) {
      if (!roadGroup.visible) return false;
      out.set(0, 0.7, 0).applyMatrix4(markers[a.marker].g.worldMatrix);
      return true;
    }
    if ('link' in a) {
      const m = linkMeshes[a.link * 3 + 1]?.mesh;
      if (!m || !m.visible) return false;
      out.set(0, 0, 0).applyMatrix4(m.worldMatrix);
      return true;
    }
    if ('from' in a) {
      const k = smooth(a.span[0], a.span[1], T);
      const ok1 = anchorPoint(a.from, T, p0);
      const ok2 = anchorPoint(a.to, T, p1v);
      if (!ok1 || !ok2) return false;
      out.set(p0[0] + (p1v[0] - p0[0]) * k, p0[1] + (p1v[1] - p0[1]) * k + Math.sin(Math.PI * k) * 0.5, p0[2] + (p1v[2] - p0[2]) * k + Math.sin(Math.PI * k) * 0.4);
      return true;
    }
    return false;
  };

  const lp = new Vec3();
  const updateLabels = (T: number, _f: ReturnType<typeof flags>) => {
    const vw = window.innerWidth;
    for (const L of labelEls) {
      const o = window01(L.spec.show[0], L.spec.show[1], T, 0.04);
      if (o <= 0.01 || !anchorPoint(L.spec.at, T, lp)) {
        if (L.el.style.opacity !== '0') L.el.style.opacity = '0';
        continue;
      }
      const [x, y, w] = toScreen(lp);
      if (w <= 0) {
        L.el.style.opacity = '0';
        continue;
      }
      const txt = typeof L.spec.text === 'function' ? L.spec.text(T, { size: world.user.size ?? (T > CH.audience + 0.55 ? 'medium' : 'small') }) : L.spec.text;
      if (txt !== L.text) {
        L.text = txt;
        L.box.textContent = txt;
      }
      const k = mobile ? 0.6 : 1;
      let dx = L.spec.dx * k;
      const dy = L.spec.dy * k;
      // Que la caja no se salga de la pantalla
      const bw = L.box.offsetWidth || 160;
      const bx = x + dx;
      if (bx + bw / 2 > vw - 10) dx -= bx + bw / 2 - (vw - 10);
      if (bx - bw / 2 < 10) dx += 10 - (bx - bw / 2);
      L.el.style.opacity = String(o);
      L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      L.box.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
      const len = Math.hypot(dx, dy);
      L.line.style.width = `${Math.max(0, len - 14)}px`;
      L.line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    }
  };

  world.ready = true;
  document.documentElement.classList.add('world-ready');
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      surveyLink.remove();
      if (labelsRoot) labelsRoot.textContent = '';
      world.ready = false;
      document.documentElement.classList.remove('world-ready', 'world-can-grab', 'world-grabbing');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
