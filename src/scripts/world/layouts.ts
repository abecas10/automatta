// Coreografía del mundo 3D: dónde está cada hoja en cada acto de la página.
// Cada acto es una función pura (hoja, contexto) → postura. Entre actos se interpola
// con un retraso distinto por hoja, para que el cambio se propague como una ola.
import { ACT, ACT_COUNT, KIND } from './constants';
export { ACT };

export type Pose = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  /** Escala de la hoja. */
  s: number;
  /** Cuánto ondea el papel (0 = rígido). */
  bend: number;
  /** 0 = documento desordenado (rojo), 1 = en orden (sello verde). */
  clean: number;
};

export type Ctx = {
  /** Tiempo en segundos. */
  t: number;
  /** Reloj de la tormenta (se congela en "una misma causa"). */
  T: number;
  /** Semiancho y semialto visibles en z = 0. */
  A: number;
  B: number;
  N: number;
  mobile: boolean;
  /** Avance del río de documentos. */
  flow: number;
  /** Postura del documento de la encuesta (calculada desde el DOM). */
  survey: Pose | null;
};



const TAU = Math.PI * 2;

/** Aleatorio determinista por hoja (0..1). */
export function rnd(i: number, k: number) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Tipo de documento de cada hoja (reparto ponderado). */
export function kindOf(i: number) {
  const r = rnd(i, 99);
  const table: [number, number][] = [
    [0.18, KIND.invoiceA],
    [0.32, KIND.invoiceB],
    [0.46, KIND.reminder],
    [0.59, KIND.sheet],
    [0.71, KIND.bank],
    [0.83, KIND.supplier],
    [0.93, KIND.ticket],
    [1.01, KIND.tax],
  ];
  return table.find(([p]) => r < p)![1];
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mod = (a: number, n: number) => ((a % n) + n) % n;

function pose(p: Partial<Pose>): Pose {
  return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, bend: 0, clean: 0, ...p };
}

// ---------- Actos ----------

function cloud(i: number, c: Ctx): Pose {
  const { t, A, B, mobile } = c;
  const center = mobile ? [0, -B * 0.82, -2.2] : [A * 0.5, -0.05, -0.8];
  const R = mobile ? [A * 1.25, B * 0.32, 1.6] : [A * 0.44, B * 0.82, 2.3];
  const u = rnd(i, 1) * TAU;
  const v = Math.acos(2 * rnd(i, 2) - 1);
  const rad = Math.cbrt(rnd(i, 3));
  let lx = Math.sin(v) * Math.cos(u) * rad * R[0];
  const ly = Math.sin(v) * Math.sin(u) * rad * R[1];
  let lz = Math.cos(v) * rad * R[2];
  // La nube gira despacio sobre sí misma.
  const a = t * 0.05;
  [lx, lz] = [lx * Math.cos(a) - lz * Math.sin(a), lx * Math.sin(a) + lz * Math.cos(a)];
  return pose({
    x: center[0] + lx + Math.sin(t * 0.25 + rnd(i, 4) * TAU) * 0.12,
    y: center[1] + ly + Math.cos(t * 0.21 + rnd(i, 5) * TAU) * 0.16,
    z: center[2] + lz,
    rx: (rnd(i, 6) - 0.5) * 1.1 + Math.sin(t * 0.3 + rnd(i, 7) * 9) * 0.15,
    ry: (rnd(i, 8) - 0.5) * 1.5 + Math.sin(t * 0.17 + rnd(i, 9) * 9) * 0.2,
    rz: (rnd(i, 10) - 0.5) * 0.9,
    s: mobile ? 0.9 : 1,
    bend: 0.35,
    clean: 0,
  });
}

function storm(i: number, c: Ctx): Pose {
  const { T, A, mobile } = c;
  const theta = rnd(i, 11) * TAU + T * (0.22 + 0.32 * rnd(i, 12));
  const rho = mobile ? 0.95 + rnd(i, 13) * (A + 1.3) : 1.35 + rnd(i, 13) * (A + 1.6);
  const z = mod(rnd(i, 14) * 20 + T * 2.3 * (0.55 + rnd(i, 15)), 20) - 14;
  // Se encogen justo antes de pasar por detrás de la cámara (y reaparecen al fondo, en la niebla).
  const s = smooth(6.2, 4.6, z) * (mobile ? 0.9 : 1);
  return pose({
    x: Math.cos(theta) * rho,
    y: Math.sin(theta) * rho * 0.72,
    z,
    rx: T * (rnd(i, 16) - 0.5) * 2.6 + rnd(i, 17) * 3,
    ry: T * (rnd(i, 18) - 0.5) * 2.6 + rnd(i, 19) * 6,
    rz: theta + rnd(i, 20),
    s,
    bend: 0.95,
    clean: 0,
  });
}

/** Rejilla ordenada: posición de la hoja i en la cuadrícula. */
function gridSlot(i: number, c: Ctx) {
  const { A, B, N, mobile } = c;
  const cols = mobile ? 7 : 14;
  const rows = Math.ceil(N / cols);
  const areaW = mobile ? A * 1.8 : A * 1.0;
  const areaH = mobile ? B * 0.95 : B * 1.55;
  const cell = Math.min(areaW / cols, areaH / (rows * 1.414));
  const col = i % cols;
  const row = Math.floor(i / cols);
  return {
    cols,
    rows,
    col,
    row,
    cell,
    gx: (col - (cols - 1) / 2) * cell,
    gy: ((rows - 1) / 2 - row) * cell * 1.414,
    cx: mobile ? 0 : A * 0.46,
    cy: mobile ? -B * 0.4 : 0,
  };
}

export const SHEET_W = 0.62;

function grid(i: number, c: Ctx): Pose {
  const g = gridSlot(i, c);
  const sw = c.mobile ? SHEET_W * 0.68 : SHEET_W;
  return pose({
    x: g.cx + g.gx,
    y: g.cy + g.gy,
    z: -1.2,
    s: (g.cell * 0.88) / sw,
    bend: 0.04,
    clean: 1,
  });
}

function floor(i: number, c: Ctx): Pose {
  const g = gridSlot(i, c);
  const { A, B, mobile } = c;
  const sw = mobile ? SHEET_W * 0.68 : SHEET_W;
  const depth = g.cell * 1.414 * 1.05;
  return pose({
    x: (mobile ? 0 : A * 0.18) + g.gx * 1.25,
    y: -B * 0.98,
    z: 1.2 - g.row * depth * 1.25,
    rx: -Math.PI / 2 + 0.12,
    s: ((g.cell * 0.88) / sw) * 1.25,
    bend: 0,
    clean: 1,
  });
}

function river(i: number, c: Ctx): Pose {
  const { A, B, t, flow, mobile } = c;
  const u = mod(rnd(i, 21) + flow + t * 0.012, 1);
  const z = -0.6 - rnd(i, 22) * (mobile ? 2.5 : 4.2);
  const span = A * ((10 - z) / 10) * 1.3;
  const x = span - u * span * 2;
  // Pasan del desorden al orden al cruzar el escáner (x = 0).
  const clean = smooth(0.25, -0.25, x);
  return pose({
    x,
    y: -B * (mobile ? 0.93 : 0.9) + (rnd(i, 23) - 0.5) * 0.22 + Math.sin(u * 7 + rnd(i, 24) * TAU) * 0.04,
    z,
    rx: -1.3 + (rnd(i, 25) - 0.5) * 0.16,
    ry: (rnd(i, 26) - 0.5) * 0.3,
    rz: (rnd(i, 27) - 0.5) * 0.4 + (1 - clean) * (rnd(i, 28) - 0.5) * 0.6,
    s: mobile ? 0.7 : 0.78,
    bend: 0.1 + (1 - clean) * 0.22,
    clean,
  });
}

function stack(i: number, order: number, base: [number, number, number], gap: number, s: number, t: number, spin: number): Pose {
  return pose({
    x: base[0] + (rnd(i, 31) - 0.5) * 0.05,
    y: base[1] + order * gap,
    z: base[2] + (rnd(i, 32) - 0.5) * 0.05,
    rx: -Math.PI / 2,
    ry: t * spin + (rnd(i, 33) - 0.5) * 0.12,
    s,
    bend: 0,
    clean: 1,
  });
}

function tower(i: number, c: Ctx): Pose {
  const { A, B, t, mobile, N } = c;
  const gap = mobile ? 1.1 / N : 1.7 / N;
  return stack(i, i, mobile ? [0, -B * 0.7, -2] : [A * 0.68, -B * 0.72, -0.6], gap, mobile ? 1.2 : 1.6, t, 0.14);
}

function piles2(i: number, c: Ctx): Pose {
  const { A, B, t, mobile, N } = c;
  const split = Math.round(N * 0.3);
  const small = i < split;
  const gap = mobile ? 0.9 / N : 1.3 / N;
  const x = (small ? -1 : 1) * A * (mobile ? 0.5 : 0.42);
  return stack(i, small ? i : i - split, [x, -B * 1.02, -1.4], gap, mobile ? 0.9 : 1.25, t, small ? 0.05 : -0.05);
}

function piles4(i: number, c: Ctx): Pose {
  const { A, B, t, mobile, N } = c;
  // 10 %, 20 %, 30 % y 40 % de las hojas: la empresa crece paso a paso.
  const cuts = [0.1, 0.3, 0.6, 1].map((v) => Math.round(v * N));
  const k = cuts.findIndex((cut) => i < cut);
  const order = i - (k > 0 ? cuts[k - 1] : 0);
  const xs = [-0.69, -0.23, 0.23, 0.69];
  const gap = mobile ? 1.0 / N : 1.7 / N;
  return stack(i, order, [A * xs[k] * (mobile ? 1.05 : 1), -B * 0.98, -1.2], gap, mobile ? 0.55 : 0.95, t, 0.04 * (k % 2 ? 1 : -1));
}

function fallen(i: number, c: Ctx): Pose {
  const { A, B, t } = c;
  return pose({
    x: (rnd(i, 41) - 0.5) * A * 2.4,
    y: -B * 2.1 - rnd(i, 42) * 2.5,
    z: -1 - rnd(i, 43) * 4,
    rx: t * 0.3 + rnd(i, 44) * 6,
    ry: rnd(i, 45) * 6,
    rz: rnd(i, 46) * 6,
    s: 1,
    bend: 0.6,
    clean: 1,
  });
}

function surveyAct(i: number, c: Ctx): Pose {
  if (i === 0 && c.survey) return c.survey;
  return fallen(i, c);
}

/** Fase a partir de la cual la hoja 0 ya muestra la encuesta (a media vuelta). */
export const SURVEY_SWAP = ACT.piles4 + 0.3;

const ACTS: ((i: number, c: Ctx) => Pose)[] = [cloud, storm, storm, grid, floor, river, tower, piles2, piles4, surveyAct, surveyAct];

// ---------- Mezcla entre actos ----------

/** Retraso de cada hoja al entrar en un acto (0..MAX_DELAY): crea la ola. */
const MAX_DELAY = 0.4;
function delay(act: number, i: number, c: Ctx) {
  if (act === ACT.grid) {
    // El orden se propaga de izquierda a derecha, como un sello que avanza.
    const g = gridSlot(i, c);
    return (g.col / g.cols) * 0.75 * MAX_DELAY + rnd(i, 51) * 0.25 * MAX_DELAY;
  }
  if (act === ACT.survey && i === 0) return 0;
  return rnd(i, 52) * MAX_DELAY;
}

/** Cuánto se eleva una hoja a mitad de viaje entre dos actos. */
const LIFT = [0, 0.2, 0, 0.6, 0.3, 0.5, 0.8, 0.6, 0.6, 0.9, 0];

function lerpAngle(a: number, b: number, t: number) {
  let d = mod(b - a + Math.PI, TAU) - Math.PI;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
}

export function poseAt(i: number, phase: number, c: Ctx): Pose {
  const k = Math.max(0, Math.min(Math.floor(phase), ACT_COUNT - 1));
  const f = phase - k;
  const a = ACTS[k](i, c);
  if (f < 1e-4 || k >= ACT_COUNT - 1) return a;
  const b = ACTS[k + 1](i, c);
  const d = delay(k + 1, i, c);
  const fi = ease(clamp((f - d) / (1 - MAX_DELAY)));
  const lift = Math.sin(Math.PI * fi) * LIFT[k + 1];
  // La hoja de la encuesta da una vuelta completa mientras viene hacia ti
  // (a media vuelta se ve el dorso y se cambia su contenido).
  const ry = k + 1 === ACT.survey && i === 0 ? lerpAngle(a.ry, 0, fi) + TAU * fi : lerpAngle(a.ry, b.ry, fi);
  return {
    x: a.x + (b.x - a.x) * fi,
    y: a.y + (b.y - a.y) * fi + lift,
    z: a.z + (b.z - a.z) * fi + lift * 0.6,
    rx: lerpAngle(a.rx, b.rx, fi),
    ry,
    rz: lerpAngle(a.rz, b.rz, fi),
    s: a.s + (b.s - a.s) * fi,
    bend: a.bend + (b.bend - a.bend) * fi + Math.sin(Math.PI * fi) * 0.35,
    // El sello llega cuando la hoja ya está casi en su sitio.
    clean: a.clean + (b.clean - a.clean) * smooth(0.55, 1, fi),
  };
}
