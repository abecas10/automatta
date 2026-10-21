// El guion "de papel a tu móvil": qué hace cada objeto en cada paso.
// T = paso + avance dentro del paso (ver chapters.ts). Todo es función de T,
// así que la escena se puede recorrer hacia delante y hacia atrás.
import { Actor, E } from './keys';
import { CH } from './chapters';
import { READ_ROWS_Y, SUP_ROWS_Y, SH, type ScreenState } from './screen';
import es from '../../content/es';

const L = es.story.labels;
/** Hoja tumbada sobre la mesa. */
const LIE = -Math.PI / 2;
/** Altura de la mesa. */
export const DESK = 0;
/** Escala de las hojas A4 respecto al móvil. */
const PAPER_S = 0.8;

const sheet = (o: Record<string, number> = {}) => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: PAPER_S, vis: 0, bend: 0, curl: 0, ...o });

/** Encuadres de cámara que se repiten. */
const SHOT = {
  hero: { x: 0, y: 0.95, z: 6.6, tx: 0, ty: 0.98, tz: 0 },
  desk: { x: 0, y: 4.7, z: 3.6, tx: 0, ty: 0, tz: 0.15 },
  /** El móvil de pie y la hoja tumbada delante: se ven los dos. */
  duo: { x: 0, y: 2.25, z: 6.1, tx: 0, ty: 0.64, tz: -0.1 },
  /** Solo el móvil, de cerca. */
  phone: { x: 0, y: 0.98, z: 4.8, tx: 0, ty: 0.9, tz: -0.4 },
};
/** Posición del móvil de pie, flotando sobre la mesa detrás de la hoja. */
const PHONE_UP = { x: 0, y: 0.95, z: -0.4, rx: -0.06, ry: 0, rz: 0 };
/** Hoja tumbada delante del móvil. */
const FRONT = { x: 0, y: 0.004, z: 0.42, rx: LIE, ry: 0, rz: 0.03 };

export function buildScript() {
  const phone = new Actor({ x: 0, y: 0.95, z: 0, rx: 0, ry: -0.32, rz: 0, s: 1, vis: 1 });
  const inv = new Actor({ ...sheet({ x: 0.2, y: 3.4, z: -0.4, rx: LIE + 0.5, rz: 0.5, bend: 0.6 }), age: 0 });
  const excel = new Actor({ ...sheet({ x: 3.6, y: 0.004, z: 0.1, rx: LIE, rz: -0.05, curl: 1 }), typed: 0 });
  const sup = new Actor(sheet({ x: -0.3, y: 3.2, z: 0.2, rx: LIE + 0.5, rz: -0.4, bend: 0.6 }));
  const stack = new Actor({ x: 1.3, z: 0.2, h: 0, vis: 0, ry: 0.07 });
  const stamp = new Actor({ target: 0, u: 0.62, v: 0.87, press: 0, vis: 0, ink: 0 });
  const bars = new Actor({ x: 0.15, y: DESK, z: -1.55, vis: 0 });
  const desk = new Actor({ vis: 0 });
  const fx = new Actor({ fog: 0, gray: 0, freeze: 0, dark: 0 });
  const cam = new Actor({ ...SHOT.hero });

  // ---------- Hero → F-2041 cae sobre la mesa ----------
  phone.to(0.5, 1.0, { x: 2.45, y: 0.032, z: 1.0, rx: Math.PI / 2, ry: 0, rz: 0.38 });
  desk.to(0.5, 0.85, { vis: 1 });
  cam.to(0.5, 1.05, SHOT.desk);
  inv.set(0.6, { vis: 1 });
  inv.to(0.62, 1.08, { x: 0, y: 0.004, z: 0.12, rx: LIE, ry: 0, rz: 0.06, bend: 0, curl: 1 }, E.out);

  // ---------- 2 · Alguien la teclea a mano ----------
  inv.to(CH.typing, CH.typing + 0.2, { x: -0.85 });
  excel.to(CH.typing + 0.04, CH.typing + 0.24, { x: 0.85, vis: 1 }, E.out);
  excel.to(CH.typing + 0.25, CH.typing + 0.9, { typed: 1 }, E.lin);
  cam.to(CH.typing, CH.typing + 0.25, { y: 4.9, z: 3.9 });

  // ---------- 3 · Vence y nadie reclama ----------
  excel.to(CH.overdue, CH.overdue + 0.16, { x: 3.8, vis: 0 }, E.in);
  inv.to(CH.overdue, CH.overdue + 0.22, { x: -0.45 });
  inv.to(CH.overdue + 0.08, CH.overdue + 0.8, { age: 1 }, E.lin);
  stamp.set(CH.overdue + 0.3, { target: 0, u: 0.62, v: 0.87, ink: 0 });
  stamp.to(CH.overdue + 0.32, CH.overdue + 0.38, { vis: 1 });
  stamp.to(CH.overdue + 0.4, CH.overdue + 0.47, { press: 1 }, E.slam);
  stamp.to(CH.overdue + 0.5, CH.overdue + 0.57, { press: 0 }, E.out);
  stamp.to(CH.overdue + 0.56, CH.overdue + 0.62, { vis: 0 });
  stack.to(CH.overdue + 0.45, CH.overdue + 0.52, { vis: 1 });
  stack.to(CH.overdue + 0.5, CH.overdue + 0.95, { h: 0.26 }, E.out);
  cam.to(CH.overdue, CH.overdue + 0.25, { x: 0.35, y: 4.4, z: 3.4, tx: 0.35 });

  // ---------- 4 · No ves tu caja ----------
  bars.to(CH.fog + 0.05, CH.fog + 0.35, { vis: 1 }, E.out);
  fx.to(CH.fog + 0.1, CH.fog + 0.45, { fog: 1 });
  cam.to(CH.fog, CH.fog + 0.35, { x: 0.25, y: 3.5, z: 4.9, tx: 0.25, ty: 0.4, tz: -0.8 });

  // ---------- 5 · Una misma causa: todo se congela ----------
  fx.to(CH.cause, CH.cause + 0.2, { freeze: 1 });
  fx.to(CH.cause + 0.05, CH.cause + 0.3, { gray: 1 });
  cam.to(CH.cause, CH.cause + 0.95, { y: 4.6, z: 5.7 }, E.lin);

  // ---------- 6 · El móvil se levanta y se enciende ----------
  fx.to(CH.automatta, CH.automatta + 0.2, { fog: 0, gray: 0, freeze: 0 });
  bars.to(CH.automatta, CH.automatta + 0.15, { vis: 0 });
  stack.to(CH.automatta + 0.05, CH.automatta + 0.3, { h: 0 });
  stack.to(CH.automatta + 0.28, CH.automatta + 0.32, { vis: 0 });
  inv.to(CH.automatta, CH.automatta + 0.3, FRONT);
  phone.to(CH.automatta + 0.08, CH.automatta + 0.5, PHONE_UP, E.io);
  cam.to(CH.automatta, CH.automatta + 0.5, SHOT.duo);

  // ---------- 7 · Los datos vuelan del papel a la pantalla ----------
  // (las "fichas" de cada dato son etiquetas; ver más abajo)

  // ---------- 8 · Reclama por ti ----------
  cam.to(CH.cobros, CH.cobros + 0.25, SHOT.phone);
  phone.to(CH.cobros, CH.cobros + 0.3, { ry: -0.14 });

  // ---------- 9 · Llega el cobro y el sello marca COBRADA ----------
  cam.to(CH.tesoreria, CH.tesoreria + 0.25, SHOT.duo);
  phone.to(CH.tesoreria, CH.tesoreria + 0.25, { ry: 0 });
  stamp.set(CH.tesoreria + 0.38, { target: 0, u: 0.6, v: 0.87, ink: 1 });
  stamp.to(CH.tesoreria + 0.4, CH.tesoreria + 0.46, { vis: 1 });
  stamp.to(CH.tesoreria + 0.48, CH.tesoreria + 0.54, { press: 1 }, E.slam);
  stamp.to(CH.tesoreria + 0.57, CH.tesoreria + 0.63, { press: 0 }, E.out);
  stamp.to(CH.tesoreria + 0.62, CH.tesoreria + 0.68, { vis: 0 });

  // ---------- 10 · El papel entra en el móvil: apunte enlazado ----------
  inv.to(CH.cierre + 0.04, CH.cierre + 0.24, { y: 0.75, z: 0.35, rx: -0.15, rz: 0, s: 0.42, bend: 0.25, curl: 0 });
  inv.to(CH.cierre + 0.24, CH.cierre + 0.42, { x: 0, y: 0.92, z: -0.38, rx: -0.06, s: 0.08, vis: 0, bend: 0 }, E.in);
  cam.to(CH.cierre + 0.15, CH.cierre + 0.45, SHOT.phone);

  // ---------- 11 · El IVA se prepara solo ----------
  phone.to(CH.impuestos, CH.impuestos + 0.95, { ry: 0.16 }, E.lin);

  // ---------- 12 · Las que pagas, también ----------
  phone.to(CH.proveedores, CH.proveedores + 0.2, { ry: 0 });
  cam.to(CH.proveedores, CH.proveedores + 0.22, SHOT.duo);
  sup.set(CH.proveedores + 0.02, { vis: 1 });
  sup.to(CH.proveedores + 0.03, CH.proveedores + 0.3, { ...FRONT, rz: -0.04, bend: 0, curl: 1 }, E.out);
  stamp.set(CH.proveedores + 0.68, { target: 1, u: 0.64, v: 0.92, ink: 1 });
  stamp.to(CH.proveedores + 0.7, CH.proveedores + 0.75, { vis: 1 });
  stamp.to(CH.proveedores + 0.77, CH.proveedores + 0.82, { press: 1 }, E.slam);
  stamp.to(CH.proveedores + 0.85, CH.proveedores + 0.9, { press: 0 }, E.out);
  stamp.to(CH.proveedores + 0.9, CH.proveedores + 0.95, { vis: 0 });

  // ---------- 13 · Verifactu: de noche, solo el móvil ----------
  sup.to(CH.verifactu - 0.06, CH.verifactu + 0.12, { y: 0.75, z: 0.3, rx: -0.15, rz: 0, s: 0.08, vis: 0, curl: 0 }, E.in);
  desk.to(CH.verifactu - 0.05, CH.verifactu + 0.15, { vis: 0 });
  fx.to(CH.verifactu, CH.verifactu + 0.15, { dark: 1 });
  cam.to(CH.verifactu, CH.verifactu + 0.25, { ...SHOT.phone, ty: 1.02, z: 5.2 });
  phone.to(CH.verifactu, CH.verifactu + 0.3, { ry: -0.22 });

  // ---------- 14 · Pequeña o mediana ----------
  fx.to(CH.audience - 0.05, CH.audience + 0.08, { dark: 0 });
  cam.to(CH.audience, CH.audience + 0.25, SHOT.phone);
  phone.to(CH.audience, CH.audience + 0.3, { ry: 0.12 });

  // ---------- 15 · La pantalla es la encuesta ----------
  phone.to(CH.survey, CH.survey + 0.3, { ry: -0.1, z: -0.2 });
  cam.to(CH.survey, CH.survey + 0.3, { z: 4.6 });
  phone.to(CH.end, CH.end + 0.5, { y: 3.4, vis: 0 }, E.in);

  // ---------- Etiquetas: los objetos explican lo que pasa ----------
  const invFields: [number, number][] = [
    [0.3, 0.29],
    [0.86, 0.69],
    [0.9, 0.59],
    [0.2, 0.91],
  ];
  const supFields: [number, number][] = [
    [0.3, 0.38],
    [0.3, 0.48],
    [0.3, 0.59],
  ];
  const labels: LabelSpec[] = [
    { text: L.typing, at: { actor: 'excel', uv: [0.5, 0.06] }, show: [CH.typing + 0.12, CH.typing + 0.98], dx: 0, dy: -36 },
    { text: L.typo, at: { actor: 'excel', uv: [0.86, 0.23] }, show: [CH.typing + 0.35, CH.typing + 0.98], dx: 60, dy: 26, tone: 'red' },
    {
      text: (T) => `${L.day} ${Math.round(1 + 89 * Math.min(1, Math.max(0, (T - CH.overdue - 0.08) / 0.72)))} · ${L.unpaid}`,
      at: { actor: 'inv', uv: [0.5, 0.45] },
      show: [CH.overdue + 0.08, CH.overdue + 0.98],
      dx: 0,
      dy: 0,
      style: 'big',
    },
    { text: L.pile, at: { stack: 1 }, show: [CH.overdue + 0.6, CH.overdue + 0.98], dx: 30, dy: -40, tone: 'red' },
    { text: L.fog, at: { world: [0.25, DESK + 0.9, -1.4] }, show: [CH.fog + 0.3, CH.fog + 0.98], dx: 0, dy: -20, style: 'note' },
    // Cada dato vuela del papel a su fila en la pantalla
    ...L.fields.map((t, i) => ({
      text: t,
      at: {
        from: { actor: 'inv', uv: invFields[i] },
        to: { actor: 'phone', uv: [0.74, READ_ROWS_Y[i] / SH] },
        span: [CH.read + 0.15 + i * 0.13, CH.read + 0.35 + i * 0.13] as [number, number],
      },
      show: [CH.read + 0.12 + i * 0.13, CH.read + 0.37 + i * 0.13] as [number, number],
      dx: 0,
      dy: 0,
      style: 'chip' as const,
    })),
    { text: L.stamp, at: { actor: 'inv', uv: [0.6, 1.02] }, show: [CH.tesoreria + 0.58, CH.tesoreria + 0.98], dx: 0, dy: 26, tone: 'green' },
    ...L.supplierFields.map((t, i) => ({
      text: t,
      at: {
        from: { actor: 'sup', uv: supFields[i] },
        to: { actor: 'phone', uv: [0.3, (SUP_ROWS_Y[i] - 10) / SH] },
        span: [CH.proveedores + 0.32 + i * 0.1, CH.proveedores + 0.5 + i * 0.1] as [number, number],
      },
      show: [CH.proveedores + 0.3 + i * 0.1, CH.proveedores + 0.52 + i * 0.1] as [number, number],
      dx: 0,
      dy: 0,
      style: 'chip' as const,
    })),
    { text: L.tapPhone, at: { actor: 'phone', uv: [1.0, 0.5] }, show: [CH.survey + 0.4, CH.survey + 0.98], dx: 120, dy: 0, tone: 'green' },
  ];

  return { phone, inv, excel, sup, stack, stamp, bars, desk, fx, cam, labels };
}

export type Script = ReturnType<typeof buildScript>;

export type Anchor =
  | { actor: string; uv: readonly number[] }
  | { world: readonly number[] }
  | { stack: number }
  | { from: { actor: string; uv: readonly number[] }; to: { actor: string; uv: readonly number[] }; span: [number, number] };

export type LabelSpec = {
  text: string | ((T: number) => string);
  at: Anchor;
  show: [number, number];
  dx: number;
  dy: number;
  style?: 'pill' | 'big' | 'note' | 'chip';
  tone?: 'green' | 'red' | 'mint';
  desktop?: boolean;
};

type User = { stamped: boolean; approved: boolean; tamperAt: number; size: 'small' | 'medium' | null };

const q = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 50) / 50;

/** Estados de las texturas del papel (según T y lo que haya hecho el usuario). */
export function paperFlags(T: number, user: User) {
  return {
    overdue: T >= CH.overdue + 0.45,
    paid: T >= CH.tesoreria + 0.52 || (user.stamped && T >= CH.tesoreria),
    supApproved: T >= CH.proveedores + 0.8 || (user.approved && T >= CH.proveedores),
    supRead: q((T - CH.proveedores - 0.3) / 0.3),
  };
}

/** Qué muestra la pantalla del móvil en cada momento. */
export function screenAt(T: number, user: User, time: number, hover: boolean): ScreenState {
  if (T < 0.7) return { kind: 'lock' };
  if (T < CH.automatta + 0.2) return { kind: 'off' };
  if (T < CH.automatta + 0.75) return { kind: 'wake', p: q((T - CH.automatta - 0.2) / 0.5) };
  if (T < CH.cobros) return { kind: 'read', p: q((T - CH.read - 0.1) / 0.7) };
  if (T < CH.tesoreria) return { kind: 'cobros', p: q((T - CH.cobros - 0.05) / 0.85) };
  const paid = T >= CH.tesoreria + 0.52 || user.stamped;
  if (T < CH.cierre + 0.38) return { kind: 'tesoreria', p: q((T - CH.tesoreria - 0.05) / 0.9), paid };
  if (T < CH.impuestos) return { kind: 'cierre', p: q((T - CH.cierre - 0.38) / 0.5) };
  if (T < CH.proveedores) return { kind: 'impuestos', p: q((T - CH.impuestos - 0.05) / 0.8) };
  if (T < CH.verifactu) return { kind: 'proveedores', p: q((T - CH.proveedores - 0.3) / 0.35), approved: T >= CH.proveedores + 0.8 || user.approved };
  if (T < CH.audience) return { kind: 'verifactu', p: q((T - CH.verifactu - 0.1) / 0.5), tamper: performance.now() - user.tamperAt < 2600 };
  if (T < CH.survey) {
    const size = user.size ?? (T > CH.audience + 0.55 ? 'medium' : 'small');
    return { kind: 'audience', size, scroll: size === 'medium' ? Math.round(time * 12) / 12 : 0 };
  }
  return { kind: 'survey', ticks: Math.max(0, Math.min(4, Math.floor((T - CH.survey - 0.12) / 0.1))), hover };
}
