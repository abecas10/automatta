// Render del mundo 3D con OGL. Se carga bajo demanda (import dinámico) después del hero.
import { Renderer, Camera, Geometry, Program, Mesh, Texture, Plane, Transform } from 'ogl';
import { buildAtlas, ATLAS_COLS, KIND, SHEET_RATIO } from './atlas';
import { poseAt, kindOf, ACT, SHEET_W, SURVEY_SWAP, type Ctx, type Pose } from './layouts';
import { world } from './state';

const FOV = 35;
const CAM_Z = 10;
const TAN = Math.tan(((FOV / 2) * Math.PI) / 180);

const PAPER = [0.961, 0.965, 0.953]; // #f5f6f3
const INK = [0.078, 0.125, 0.106]; // #14201b

const vertex = /* glsl */ `
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

mat3 rot(vec3 r) {
  float cx = cos(r.x), sx = sin(r.x), cy = cos(r.y), sy = sin(r.y), cz = cos(r.z), sz = sin(r.z);
  mat3 X = mat3(1.0, 0.0, 0.0, 0.0, cx, sx, 0.0, -sx, cx);
  mat3 Y = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 Z = mat3(cz, sz, 0.0, -sz, cz, 0.0, 0.0, 0.0, 1.0);
  return Z * Y * X;
}

// Forma del papel: ondas suaves y esquinas que se levantan.
float wave(vec2 q, float b) {
  float t = uTime;
  float w = 0.10 * sin(q.x * 2.6 + t * 2.1 + aSeed * 6.283)
          + 0.07 * sin(q.y * 2.2 + t * 1.6 + aSeed * 3.1)
          + 0.16 * q.x * q.x * sin(t * 1.3 + aSeed * 9.0)
          + 0.10 * q.y * q.y * cos(t * 1.1 + aSeed * 5.0);
  return w * b;
}

void main() {
  vUv = uv;
  vSeed = aSeed;
  vClean = aParams.z;
  vKind = aParams.w;
  float s = aParams.x;
  float b = aParams.y;
  vec2 q = position.xy * 2.0;
  vec2 size = uSheet * s;
  vec3 p = vec3(position.xy * size, wave(q, b) * s);
  float e = 0.02;
  float hx = (wave(q + vec2(e, 0.0), b) - wave(q - vec2(e, 0.0), b)) * s / (2.0 * e) / (size.x * 0.5);
  float hy = (wave(q + vec2(0.0, e), b) - wave(q - vec2(0.0, e), b)) * s / (2.0 * e) / (size.y * 0.5);
  mat3 R = rot(aRot);
  vN = R * normalize(vec3(-hx, -hy, 1.0));
  vec4 mv = viewMatrix * vec4(R * p + aOffset, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tAtlas;
uniform vec2 uCell;
uniform float uCols;
uniform vec3 uBg;
uniform vec2 uFog;
uniform float uAlpha;
uniform float uDark;
uniform vec3 uLight;
varying vec2 vUv;
varying vec3 vN;
varying float vClean;
varying float vKind;
varying float vDepth;
varying float vSeed;

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
  vec4 messy = cell(kind * 2.0, vUv);
  vec4 tidy = cell(kind * 2.0 + 1.0, vUv);
  // El orden entra como tinta que empapa el papel, no como un fundido plano.
  float n = noise(vUv * vec2(7.0, 10.0) + vSeed * 17.0) * 0.75 + noise(vUv * 38.0 + vSeed) * 0.25;
  float m = smoothstep(n - 0.07, n + 0.07, vClean * 1.16 - 0.08);
  vec4 tex = mix(messy, tidy, m);
  if (tex.a < 0.5) discard;

  vec3 col = tex.rgb;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) {
    // Dorso: papel liso con la tinta transparentándose un poco.
    N = -N;
    col = vec3(0.93, 0.94, 0.925) - (1.0 - tex.rgb) * 0.06;
  }
  float diff = max(dot(N, normalize(uLight)), 0.0);
  float light = min(1.0, 0.8 + 0.26 * diff);
  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  light *= mix(0.84, 1.0, smoothstep(0.0, 0.018, edge));
  col *= light;
  // De noche (Verifactu): papel más frío y un filo de luz verde.
  col *= mix(vec3(1.0), vec3(0.84, 0.88, 0.86), uDark);
  col += vec3(0.56, 0.83, 0.70) * pow(1.0 - abs(N.z), 4.0) * 0.06 * uDark;

  float fog = smoothstep(uFog.x, uFog.y, vDepth);
  col = mix(col, uBg, fog);
  col = mix(uBg, col, uAlpha);
  gl_FragColor = vec4(col, 1.0);
}
`;

// Cortina de luz del escáner (río de "Cómo funciona").
const gateVertex = /* glsl */ `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const gateFragment = /* glsl */ `
precision highp float;
uniform float uAlpha;
uniform float uTime;
varying vec2 vUv;
void main() {
  float v = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
  float h = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
  float scan = 0.75 + 0.25 * sin(vUv.y * 40.0 - uTime * 6.0);
  gl_FragColor = vec4(0.12, 0.42, 0.29, v * h * scan * uAlpha * 0.55);
}
`;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export async function startWorld(canvas: HTMLCanvasElement) {
  const mobile = world.mobile;
  const N = mobile ? (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 48 : 64) : 140;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);

  const renderer = new Renderer({ canvas, dpr, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const gl = renderer.gl;
  gl.clearColor(PAPER[0], PAPER[1], PAPER[2], 1);

  const camera = new Camera(gl, { fov: FOV, near: 0.1, far: 60 });
  camera.position.set(0, 0, CAM_Z);

  const atlas = await buildAtlas(mobile ? 1024 : 2048);
  const texture = new Texture(gl, {
    image: atlas.canvas,
    generateMipmaps: true,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    anisotropy: 8,
  });

  const sheetW = mobile ? SHEET_W * 0.68 : SHEET_W;
  const plane = new Plane(gl, { width: 1, height: 1, widthSegments: mobile ? 6 : 10, heightSegments: mobile ? 8 : 14 });
  const offsets = new Float32Array(N * 3);
  const rots = new Float32Array(N * 3);
  const params = new Float32Array(N * 4);
  const seeds = new Float32Array(N);
  const kinds = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    seeds[i] = Math.random();
    kinds[i] = kindOf(i);
  }
  const geometry = new Geometry(gl, {
    position: plane.attributes.position,
    uv: plane.attributes.uv,
    index: plane.attributes.index,
    aOffset: { instanced: 1, size: 3, data: offsets },
    aRot: { instanced: 1, size: 3, data: rots },
    aParams: { instanced: 1, size: 4, data: params },
    aSeed: { instanced: 1, size: 1, data: seeds },
  });

  const uniforms = {
    tAtlas: { value: texture },
    uCell: { value: [atlas.cellW, atlas.cellH] },
    uCols: { value: ATLAS_COLS },
    uTime: { value: 0 },
    uSheet: { value: [sheetW, sheetW * SHEET_RATIO] },
    uBg: { value: [...PAPER] },
    uFog: { value: [14, 30] },
    uAlpha: { value: 0 },
    uDark: { value: 0 },
    uLight: { value: [-0.4, 0.6, 0.75] },
  };
  const program = new Program(gl, { vertex, fragment, uniforms, cullFace: null });
  const scene = new Transform();
  const sheets = new Mesh(gl, { geometry, program, frustumCulled: false });
  sheets.setParent(scene);

  const gateUniforms = { uAlpha: { value: 0 }, uTime: { value: 0 } };
  const gate = new Mesh(gl, {
    geometry: new Plane(gl, { width: 1, height: 1 }),
    program: new Program(gl, {
      vertex: gateVertex,
      fragment: gateFragment,
      uniforms: gateUniforms,
      transparent: true,
      depthWrite: false,
      cullFace: null,
    }),
  });
  gate.setParent(scene);

  // ---------- Tamaño ----------
  let A = 1;
  const B = CAM_Z * TAN;
  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.perspective({ aspect: window.innerWidth / window.innerHeight });
    A = B * (window.innerWidth / window.innerHeight);
  };
  resize();
  window.addEventListener('resize', resize);

  // ---------- Puntero ----------
  const onPointer = (e: PointerEvent) => {
    world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    world.pointer.active = e.pointerType === 'mouse';
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  const push = new Float32Array(N * 2);
  const cam = { x: 0, y: 0 };

  // ---------- Encuesta: la hoja 0 aterriza sobre el documento del DOM ----------
  const surveyPose = (): Pose | null => {
    const el = world.surveyEl;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.height) return null;
    const z = 2;
    const halfH = (CAM_Z - z) * TAN;
    const aspect = window.innerWidth / window.innerHeight;
    const nx = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
    const ny = -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1);
    const worldH = (r.height / window.innerHeight) * 2 * halfH;
    return { x: nx * halfH * aspect, y: ny * halfH, z, rx: 0, ry: 0, rz: 0, s: worldH / (sheetW * SHEET_RATIO), bend: 0, clean: 1 };
  };

  // ---------- Bucle ----------
  let time = 0;
  let stormClock = 0;
  let last = performance.now();
  let raf = 0;
  let alpha = 0;
  let lastCss = '';
  const bg = [...PAPER];
  const ctx: Ctx = { t: 0, T: 0, A, B, N, mobile, flow: 0, survey: null };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(Math.max((now - last) / 1000, 0), 1 / 20);
    last = now;
    if (document.hidden) return;
    time += dt;

    // La fase sigue al scroll con algo de inercia: el mundo "pesa".
    world.phase += (world.target - world.phase) * (1 - Math.exp(-dt * 3.2));
    if (!Number.isFinite(world.phase) || world.phase < 0) world.phase = Math.max(0, world.target || 0);
    const phase = world.phase;

    // La tormenta corre durante el problema y se congela en "una misma causa".
    const stormSpeed = 1 - smooth(ACT.storm + 0.78, ACT.storm + 0.96, phase);
    stormClock += dt * (phase < ACT.storm ? 0.5 : stormSpeed);

    ctx.t = time;
    ctx.T = stormClock;
    ctx.A = A;
    ctx.flow += (world.flow - ctx.flow) * (1 - Math.exp(-dt * 4));
    ctx.survey = phase > ACT.piles4 ? surveyPose() : null;

    // Puntero: parallax de cámara y viento sobre las hojas (solo con ratón y al principio).
    const interactive = world.pointer.active && phase < ACT.storm + 0.5;
    const tx = phase < ACT.piles4 ? world.pointer.x * 0.35 : 0;
    const ty = phase < ACT.piles4 ? world.pointer.y * 0.22 : 0;
    cam.x += (tx - cam.x) * (1 - Math.exp(-dt * 2.5));
    cam.y += (ty - cam.y) * (1 - Math.exp(-dt * 2.5));
    const zoom = smooth(ACT.storm + 0.75, ACT.freeze, phase) * (1 - smooth(ACT.freeze, ACT.freeze + 0.6, phase));
    camera.position.set(cam.x, cam.y, CAM_Z - zoom * 0.9);
    camera.lookAt([cam.x * 0.3, cam.y * 0.3, -1]);

    for (let i = 0; i < N; i++) {
      const p = poseAt(i, phase, ctx);
      // Viento del ratón: las hojas cercanas se apartan y ondean.
      let px = 0;
      let py = 0;
      let gust = 0;
      if (interactive) {
        const f = CAM_Z / (CAM_Z - p.z);
        const sx = (p.x * f) / A;
        const sy = (p.y * f) / B;
        const dx = sx - world.pointer.x;
        const dy = (sy - world.pointer.y) * (B / A);
        const d2 = dx * dx + dy * dy;
        const force = Math.exp(-d2 / 0.03);
        const d = Math.sqrt(d2) + 1e-4;
        px = (dx / d) * force * 0.55;
        py = (dy / d) * force * 0.55;
        gust = force;
      }
      push[i * 2] += (px - push[i * 2]) * (1 - Math.exp(-dt * 6));
      push[i * 2 + 1] += (py - push[i * 2 + 1]) * (1 - Math.exp(-dt * 6));

      offsets[i * 3] = p.x + push[i * 2];
      offsets[i * 3 + 1] = p.y + push[i * 2 + 1];
      offsets[i * 3 + 2] = p.z;
      rots[i * 3] = p.rx;
      rots[i * 3 + 1] = p.ry;
      rots[i * 3 + 2] = p.rz + push[i * 2] * 0.4;
      params[i * 4] = p.s;
      params[i * 4 + 1] = p.bend + gust * 0.8;
      params[i * 4 + 2] = p.clean;
      params[i * 4 + 3] = i === 0 && phase >= SURVEY_SWAP ? KIND.survey : kinds[i];
    }
    geometry.attributes.aOffset.needsUpdate = true;
    geometry.attributes.aRot.needsUpdate = true;
    geometry.attributes.aParams.needsUpdate = true;

    // Fondo: papel de día, tinta en Verifactu.
    const target = world.dark > 0.5 ? INK : PAPER;
    const kb = 1 - Math.exp(-dt * 3);
    for (let c = 0; c < 3; c++) bg[c] += (target[c] - bg[c]) * kb;
    const dark = (bg[0] - PAPER[0]) / (INK[0] - PAPER[0]);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    // El halo del texto sigue al color real del fondo (no al de la sección).
    const css = `rgb(${Math.round(bg[0] * 255)} ${Math.round(bg[1] * 255)} ${Math.round(bg[2] * 255)})`;
    if (css !== lastCss) {
      lastCss = css;
      document.documentElement.style.setProperty('--world-bg', css);
    }

    // Niebla: espesa en "cero visibilidad", normal el resto del tiempo.
    const blind = smooth(ACT.storm + 0.5, ACT.storm + 0.62, phase) * (1 - smooth(ACT.storm + 0.78, ACT.freeze, phase));
    const fogFar = 30 - blind * 19;

    // Opacidad del mundo según el acto (en móvil se aparta más del texto).
    const mobileDim = mobile ? [1, 1, 1, 1, 0.9, 0.55, 0.4, 0.55, 0.55, 1, 1] : [1, 1, 1, 1, 1, 0.95, 1, 1, 1, 1, 1];
    const k = Math.min(Math.floor(phase), 9);
    const dim = mobileDim[k] + (mobileDim[k + 1] - mobileDim[k]) * (phase - k);
    alpha += (1 - alpha) * (1 - Math.exp(-dt * 2.5));

    uniforms.uTime.value = time;
    uniforms.uBg.value = bg;
    uniforms.uFog.value = [fogFar * 0.45, fogFar];
    uniforms.uAlpha.value = alpha * dim;
    uniforms.uDark.value = dark;

    // Escáner del río.
    const riverOn = smooth(ACT.floor + 0.6, ACT.river, phase) * (1 - smooth(ACT.river + 0.1, ACT.river + 0.5, phase));
    gateUniforms.uAlpha.value = riverOn * alpha;
    gateUniforms.uTime.value = time;
    gate.visible = riverOn > 0.01;
    gate.position.set(0, -B * (mobile ? 0.93 : 0.9) + 0.18, mobile ? -1.8 : -2.6);
    gate.rotation.y = Math.PI / 2;
    gate.scale.set(mobile ? 3 : 5, 1.1, 1);

    renderer.render({ scene, camera });
  };

  world.ready = true;
  document.documentElement.classList.add('world-ready');
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      world.ready = false;
      document.documentElement.classList.remove('world-ready');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
