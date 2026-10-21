// El guion: qué hace cada personaje en cada capítulo de la vida de F-2041.
// T = capítulo + avance dentro del capítulo (ver chapters.ts).
import { Actor, E } from './keys';
import { CH } from './chapters';
import { INVOICE_ANCHORS, EXCEL_ANCHORS, TAX_ANCHORS, SUPPLIER_ANCHORS, LEDGER_ANCHORS } from './textures';
import es from '../../content/es';

const L = es.story.labels;
const LIE = -Math.PI / 2;
/** Altura de la mesa sobre la que está la factura en "Hoy, sin Automatta". */
export const DESK = -0.6;

const sheet = (o: Partial<Record<string, number>> = {}) => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, vis: 0, bend: 0.04, ...o });

export function buildScript() {
  // ---------- Personajes ----------
  const inv = new Actor({ ...sheet({ rx: -0.12, ry: -0.32, rz: 0.04, s: 0.9, vis: 1, bend: 0.22 }), age: 0, scan: -1 });
  const excel = new Actor({ ...sheet({ x: 3.6, y: DESK + 0.025, z: -0.4, rx: LIE, rz: -0.06, s: 0.78, bend: 0 }), typed: 0 });
  const env = new Actor({ ...sheet({ y: -1.8, z: 0.06 }), flap: 1 });
  const letters = [0, 1, 2].map(() => new Actor(sheet({ x: -1.55, y: 0.55, z: 0.1, s: 0.2 })));
  const slip = new Actor(sheet({ x: 3.4, y: 0.2, z: 0.5, rz: 0.25, s: 0.85 }));
  const tax = new Actor(sheet({ x: 0.5, y: -2.2, s: 0.82 }));
  const sup = new Actor({ ...sheet({ y: 2.6, z: 0.1, rz: 0.12, s: 0.86 }), scan: -1 });
  const p1 = new Actor(sheet({ x: -4.6, z: -0.2, ry: 0.32, s: 0.55 }));
  const p2 = new Actor(sheet({ x: -4.6, z: -0.2, ry: 0.32, s: 0.55 }));
  const stamp = new Actor({ target: 0, u: 0.62, v: 0.87, press: 0, vis: 0, ink: 0 });
  const book = new Actor({ x: 0.45, y: -0.15, z: 0, rx: -0.42, ry: 0, s: 1, vis: 0, open: 0 });
  const bars = new Actor({ x: 0, y: DESK, z: -1.9, s: 1, vis: 0, known: 0, lift: 0 });
  const links = new Actor({ vis: 0 });
  const road = new Actor({ vis: 0 });
  const crowd = new Actor({ pile: 0, stream: 0, vis: 0, clean: 0 });
  const fx = new Actor({ fog: 0, gray: 0, freeze: 0, dark: 0 });
  const cam = new Actor({ x: 0, y: 0, z: 6.2, tx: 0, ty: 0, tz: 0 });

  // ---------- Hero → la mesa (0 → 1) ----------
  inv.to(0.55, 1.05, { x: -0.9, y: DESK + 0.03, z: -0.12, rx: LIE, ry: 0, rz: 0.07, s: 0.78, bend: 0 });
  cam.to(0.55, 1.05, { x: 0.05, y: 2.7, z: 3.9, tx: 0.05, ty: DESK, tz: -0.25 });

  // ---------- 1 · Alguien teclea sus datos a mano ----------
  excel.to(0.7, 1.1, { x: 0.95, vis: 1 }, E.out);
  excel.to(CH.typing + 0.15, CH.typing + 0.85, { typed: 1 }, E.lin);
  excel.to(CH.overdue, CH.overdue + 0.2, { x: 3.6, vis: 0 }, E.in);

  // ---------- 2 · Pasan los días: vence y la entierran otras facturas ----------
  inv.to(CH.overdue, CH.overdue + 0.25, { x: -0.05, z: 0.05, rz: 0.02 });
  inv.to(CH.overdue + 0.1, CH.overdue + 0.85, { age: 1 }, E.lin);
  cam.to(CH.overdue, CH.overdue + 0.3, { y: 3.3, z: 2.75, tx: 0, tz: 0 });
  stamp.set(CH.overdue + 0.28, { target: 0, u: INVOICE_ANCHORS.stamp[0], v: INVOICE_ANCHORS.stamp[1], ink: 0 });
  stamp.to(CH.overdue + 0.3, CH.overdue + 0.36, { vis: 1 });
  stamp.to(CH.overdue + 0.38, CH.overdue + 0.46, { press: 1 }, E.slam);
  stamp.to(CH.overdue + 0.5, CH.overdue + 0.58, { press: 0 }, E.out);
  stamp.to(CH.overdue + 0.58, CH.overdue + 0.64, { vis: 0 });
  crowd.to(CH.overdue + 0.45, CH.overdue + 0.55, { vis: 1 });
  crowd.to(CH.overdue + 0.5, CH.overdue + 0.95, { pile: 1 }, E.lin);

  // ---------- 3 · No sabes cómo va la caja ----------
  cam.to(CH.fog, CH.fog + 0.35, { y: 3.4, z: 4.7, tz: -0.9 });
  bars.to(CH.fog + 0.08, CH.fog + 0.35, { vis: 1 }, E.out);
  fx.to(CH.fog + 0.1, CH.fog + 0.45, { fog: 1 });

  // ---------- 4 · Una misma causa: todo se congela ----------
  fx.to(CH.cause, CH.cause + 0.2, { freeze: 1 });
  fx.to(CH.cause + 0.05, CH.cause + 0.3, { gray: 1 });
  cam.to(CH.cause, CH.cause + 0.9, { y: 3.0, z: 3.9 }, E.lin);

  // ---------- 5 · Automatta la lee sola ----------
  fx.to(CH.read, CH.read + 0.2, { fog: 0, gray: 0, freeze: 0 });
  bars.to(CH.read, CH.read + 0.12, { vis: 0 });
  crowd.to(CH.read, CH.read + 0.35, { pile: 0 });
  crowd.to(CH.read + 0.1, CH.read + 0.4, { clean: 1, vis: 0 });
  inv.to(CH.read + 0.05, CH.read + 0.4, { x: 0, y: 0, z: 0.2, rx: 0, ry: 0, rz: 0, s: 0.86, bend: 0.08 });
  cam.to(CH.read + 0.05, CH.read + 0.4, { x: 0, y: 0, z: 6.2, tx: 0, ty: 0, tz: 0 });
  inv.set(CH.read + 0.44, { scan: 1.1 });
  inv.to(CH.read + 0.45, CH.read + 0.75, { scan: -0.1 }, E.lin);
  inv.to(CH.read + 0.45, CH.read + 0.75, { age: 0 }, E.lin);
  inv.set(CH.read + 0.76, { scan: -1 });

  // ---------- 6 · Se envía y se reclama sola ----------
  env.set(CH.cobros, { x: 0, y: -1.9, vis: 0, flap: 1, s: 1 });
  env.to(CH.cobros + 0.02, CH.cobros + 0.14, { y: -0.32, vis: 1 }, E.out);
  inv.to(CH.cobros + 0.12, CH.cobros + 0.32, { y: -0.22, z: -0.03, s: 0.56 });
  inv.set(CH.cobros + 0.34, { vis: 0 });
  env.to(CH.cobros + 0.33, CH.cobros + 0.42, { flap: 0 });
  env.to(CH.cobros + 0.45, CH.cobros + 0.58, { x: -1.55, y: 0.55, s: 0.62, rz: -0.08 });
  const letterTo = [
    { x: 0.15, y: 0.78, z: 0.3, rz: -0.05 },
    { x: 0.85, y: -0.05, z: 0.35, rz: 0.04 },
    { x: 1.5, y: -0.88, z: 0.4, rz: -0.03 },
  ];
  letters.forEach((l, i) => {
    const t = CH.cobros + 0.56 + i * 0.14;
    l.to(t, t + 0.12, { ...letterTo[i], s: 0.64, vis: 1 }, E.out);
    l.to(CH.tesoreria, CH.tesoreria + 0.1, { x: 3.4, vis: 0 }, E.in);
  });
  cam.to(CH.cobros + 0.45, CH.cobros + 0.6, { z: 6.8 });

  // ---------- 7 · Llega el cobro: se cuadra y se sella ----------
  cam.to(CH.tesoreria, CH.tesoreria + 0.15, { z: 6.2 });
  env.to(CH.tesoreria + 0.02, CH.tesoreria + 0.14, { x: 0, y: -0.32, s: 1, rz: 0 });
  env.to(CH.tesoreria + 0.12, CH.tesoreria + 0.18, { flap: 1 });
  inv.set(CH.tesoreria + 0.17, { x: 0, y: -0.22, z: -0.03, s: 0.56, vis: 1 });
  inv.to(CH.tesoreria + 0.18, CH.tesoreria + 0.32, { x: -0.5, y: 0.12, z: 0.15, s: 0.84 });
  env.to(CH.tesoreria + 0.3, CH.tesoreria + 0.4, { y: -2.3, vis: 0 }, E.in);
  slip.to(CH.tesoreria + 0.3, CH.tesoreria + 0.44, { x: 0.05, y: -0.62, z: 0.3, rz: -0.06, vis: 1 }, E.out);
  // Se inclina para recibir el sello
  inv.to(CH.tesoreria + 0.42, CH.tesoreria + 0.5, { rx: -0.72, y: 0.05 });
  slip.to(CH.tesoreria + 0.42, CH.tesoreria + 0.5, { rx: -0.72, y: -0.7, z: 0.42 });
  stamp.set(CH.tesoreria + 0.4, { target: 0, u: INVOICE_ANCHORS.stamp[0] - 0.02, v: INVOICE_ANCHORS.stamp[1], ink: 1 });
  stamp.to(CH.tesoreria + 0.42, CH.tesoreria + 0.5, { vis: 1 });
  stamp.to(CH.tesoreria + 0.52, CH.tesoreria + 0.58, { press: 1 }, E.slam);
  stamp.to(CH.tesoreria + 0.6, CH.tesoreria + 0.66, { press: 0 }, E.out);
  stamp.to(CH.tesoreria + 0.64, CH.tesoreria + 0.7, { vis: 0 });
  slip.to(CH.tesoreria + 0.62, CH.tesoreria + 0.72, { x: 3.4, vis: 0 }, E.in);
  // Se aparta y aparece la previsión de caja
  inv.to(CH.tesoreria + 0.66, CH.tesoreria + 0.8, { x: -1.4, y: 0.78, z: 0, rx: -0.12, s: 0.5, rz: 0.06 });
  bars.set(CH.tesoreria + 0.6, { x: 0.55, y: -1.05, z: 0.1, known: 1, vis: 0 });
  bars.to(CH.tesoreria + 0.66, CH.tesoreria + 0.85, { vis: 1 }, E.out);
  bars.to(CH.tesoreria + 0.85, CH.tesoreria + 0.95, { lift: 1 });
  cam.to(CH.tesoreria + 0.62, CH.tesoreria + 0.8, { z: 6.6, ty: -0.1 });

  // ---------- 8 · Se archiva en el libro ----------
  bars.to(CH.cierre, CH.cierre + 0.1, { vis: 0 });
  cam.to(CH.cierre, CH.cierre + 0.2, { y: 1.3, z: 5.6, ty: -0.3, tx: 0.15 });
  book.to(CH.cierre + 0.05, CH.cierre + 0.2, { vis: 1 }, E.out);
  book.to(CH.cierre + 0.18, CH.cierre + 0.34, { open: 1 });
  inv.to(CH.cierre + 0.32, CH.cierre + 0.58, { x: 1.08, y: -0.12, z: 0.25, rx: -0.42, rz: 0, s: 0.1 }, E.in);
  inv.set(CH.cierre + 0.59, { vis: 0 });
  book.to(CH.cierre + 0.94, CH.impuestos + 0.05, { open: 0 });
  book.to(CH.impuestos + 0.02, CH.impuestos + 0.12, { vis: 0, y: -2 }, E.in);

  // ---------- 9 · Su IVA salta al modelo 303 ----------
  cam.to(CH.impuestos, CH.impuestos + 0.2, { y: 0, z: 6.2, tx: 0, ty: 0 });
  inv.set(CH.impuestos + 0.06, { x: -1.35, y: 0.25, z: 0.1, rx: 0, rz: 0.05, s: 0.5 });
  inv.to(CH.impuestos + 0.06, CH.impuestos + 0.2, { vis: 1 }, E.out);
  tax.to(CH.impuestos + 0.06, CH.impuestos + 0.24, { y: 0, vis: 1 }, E.out);
  tax.to(CH.impuestos + 0.6, CH.impuestos + 0.66, { rx: -0.7 });
  stamp.set(CH.impuestos + 0.6, { target: 1, u: TAX_ANCHORS.stamp[0], v: TAX_ANCHORS.stamp[1], ink: 1 });
  stamp.to(CH.impuestos + 0.62, CH.impuestos + 0.68, { vis: 1 });
  stamp.to(CH.impuestos + 0.7, CH.impuestos + 0.76, { press: 1 }, E.slam);
  stamp.to(CH.impuestos + 0.78, CH.impuestos + 0.84, { press: 0 }, E.out);
  stamp.to(CH.impuestos + 0.82, CH.impuestos + 0.88, { vis: 0 });
  tax.to(CH.impuestos + 0.86, CH.impuestos + 0.92, { rx: 0 });
  tax.to(CH.proveedores, CH.proveedores + 0.12, { x: 3.4, vis: 0 }, E.in);
  inv.to(CH.proveedores, CH.proveedores + 0.12, { x: -3.4, vis: 0 }, E.in);

  // ---------- 10 · Lo mismo con las facturas que pagas ----------
  sup.to(CH.proveedores + 0.06, CH.proveedores + 0.24, { y: 0, rz: 0, vis: 1 }, E.out);
  sup.set(CH.proveedores + 0.28, { scan: 1.1 });
  sup.to(CH.proveedores + 0.3, CH.proveedores + 0.55, { scan: -0.1 }, E.lin);
  sup.set(CH.proveedores + 0.56, { scan: -1 });
  sup.to(CH.proveedores + 0.58, CH.proveedores + 0.64, { rx: -0.7 });
  stamp.set(CH.proveedores + 0.58, { target: 2, u: SUPPLIER_ANCHORS.stamp[0], v: SUPPLIER_ANCHORS.stamp[1], ink: 1 });
  stamp.to(CH.proveedores + 0.6, CH.proveedores + 0.66, { vis: 1 });
  stamp.to(CH.proveedores + 0.68, CH.proveedores + 0.74, { press: 1 }, E.slam);
  stamp.to(CH.proveedores + 0.76, CH.proveedores + 0.82, { press: 0 }, E.out);
  stamp.to(CH.proveedores + 0.8, CH.proveedores + 0.86, { vis: 0 });
  sup.to(CH.proveedores + 0.84, CH.proveedores + 0.9, { rx: 0 });
  sup.to(CH.verifactu - 0.02, CH.verifactu + 0.08, { x: 3.4, vis: 0 }, E.in);

  // ---------- 11 · Verifactu: encadenada e inalterable ----------
  fx.to(CH.verifactu, CH.verifactu + 0.15, { dark: 1 });
  cam.to(CH.verifactu, CH.verifactu + 0.25, { x: 0.5, z: 6.9, tx: -1.3 });
  inv.set(CH.verifactu + 0.02, { x: 0, y: 0, z: -0.2, rx: 0, ry: 0.32, rz: 0, s: 0.55 });
  inv.to(CH.verifactu + 0.04, CH.verifactu + 0.2, { vis: 1 }, E.out);
  p1.to(CH.verifactu + 0.12, CH.verifactu + 0.32, { x: -1.5, vis: 1 }, E.out);
  p2.to(CH.verifactu + 0.18, CH.verifactu + 0.38, { x: -3.0, vis: 1 }, E.out);
  links.to(CH.verifactu + 0.36, CH.verifactu + 0.55, { vis: 1 });
  links.to(CH.audience - 0.04, CH.audience + 0.05, { vis: 0 });
  p1.to(CH.audience, CH.audience + 0.15, { x: -4.6, vis: 0 }, E.in);
  p2.to(CH.audience, CH.audience + 0.15, { x: -4.6, vis: 0 }, E.in);
  fx.to(CH.audience - 0.05, CH.audience + 0.08, { dark: 0 });

  // ---------- 12 · Pequeña o mediana ----------
  cam.to(CH.audience, CH.audience + 0.2, { x: 0, z: 6.2, tx: 0 });
  inv.to(CH.audience, CH.audience + 0.2, { x: 0, y: 0, z: 0.25, ry: -0.18, s: 0.78 });
  crowd.to(CH.audience + 0.4, CH.audience + 0.5, { vis: 1 });
  crowd.to(CH.audience + 0.45, CH.audience + 0.6, { stream: 1 });
  crowd.to(CH.roadmap - 0.05, CH.roadmap + 0.05, { stream: 0, vis: 0 });

  // ---------- 13 · Hoja de ruta ----------
  road.to(CH.roadmap + 0.02, CH.roadmap + 0.25, { vis: 1 }, E.out);
  inv.to(CH.roadmap, CH.roadmap + 0.25, { x: -0.75, y: 0.15, z: 0.4, ry: 0.5, rx: -0.08, s: 0.3 });
  cam.to(CH.roadmap, CH.roadmap + 0.25, { y: 0.9, z: 4.8, ty: -0.3, tz: -3.2 });
  cam.to(CH.roadmap + 0.25, CH.roadmap + 0.95, { z: 4.1 }, E.lin);
  road.to(CH.survey, CH.survey + 0.12, { vis: 0 });

  // ---------- 14 · La factura se da la vuelta: es la encuesta ----------
  cam.to(CH.survey, CH.survey + 0.2, { y: 0, z: 6.2, ty: 0, tz: 0 });
  inv.to(CH.survey, CH.survey + 0.25, { x: 0, y: 0, z: 0.45, rx: 0, rz: 0, s: 0.95, bend: 0.06 });
  inv.to(CH.survey + 0.1, CH.survey + 0.38, { ry: Math.PI });
  inv.to(CH.end, CH.end + 0.4, { y: 3.2, s: 0.6, vis: 0 }, E.in);

  // ---------- Etiquetas: los objetos explican lo que pasa ----------
  const labels: LabelSpec[] = [
    { text: L.typing, at: { actor: 'excel', uv: EXCEL_ANCHORS.top }, show: [CH.typing + 0.1, CH.typing + 0.98], dx: 30, dy: -46 },
    { text: L.typo, at: { actor: 'excel', uv: EXCEL_ANCHORS.typo }, show: [CH.typing + 0.3, CH.typing + 0.98], dx: 46, dy: 30, tone: 'red' },
    {
      text: (T) => `${L.day} ${Math.round(1 + 89 * Math.min(1, Math.max(0, (T - CH.overdue - 0.08) / 0.75)))} · ${L.unpaid}`,
      at: { actor: 'inv', uv: INVOICE_ANCHORS.top },
      show: [CH.overdue + 0.08, CH.overdue + 0.98],
      dx: 0,
      dy: -40,
      style: 'big',
    },
    { text: L.fog, at: { world: [0.4, DESK + 0.15, -0.6] }, show: [CH.fog + 0.3, CH.fog + 0.98], dx: 0, dy: -30, style: 'note' },
    { text: L.read, at: { actor: 'inv', uv: INVOICE_ANCHORS.top }, show: [CH.read + 0.6, CH.read + 0.98], dx: 0, dy: -30, tone: 'green' },
    ...L.fields.map((t, i) => ({
      text: t,
      at: { actor: 'inv', uv: [INVOICE_ANCHORS.client, INVOICE_ANCHORS.total, INVOICE_ANCHORS.vat, INVOICE_ANCHORS.due][i] },
      show: [CH.read + 0.6 + i * 0.06, CH.read + 0.98] as [number, number],
      dx: i === 0 || i === 3 ? -40 : 60,
      dy: [-26, 34, -30, 30][i],
      desktop: i === 2 || i === 3,
    })),
    ...L.reminders.map((t, i) => ({
      text: t,
      at: { actor: `letter${i}`, uv: [1, 0.5] },
      show: [CH.cobros + 0.66 + i * 0.14, CH.cobros + 0.99] as [number, number],
      dx: 36,
      dy: 0,
      tone: i === 2 ? ('red' as const) : undefined,
    })),
    { text: L.transfer, at: { actor: 'slip', uv: [1, 0.2] }, show: [CH.tesoreria + 0.44, CH.tesoreria + 0.64], dx: 40, dy: 34, tone: 'green' },
    { text: L.matched, at: { actor: 'inv', uv: INVOICE_ANCHORS.number }, show: [CH.tesoreria + 0.46, CH.tesoreria + 0.64], dx: -30, dy: -46 },
    { text: L.forecast, at: { bar: -1 }, show: [CH.tesoreria + 0.8, CH.tesoreria + 0.99], dx: 0, dy: -36 },
    { text: L.thisWeek, at: { bar: 0 }, show: [CH.tesoreria + 0.92, CH.tesoreria + 0.99], dx: -20, dy: -40, tone: 'green' },
    { text: L.tight, at: { bar: 7 }, show: [CH.tesoreria + 0.86, CH.tesoreria + 0.99], dx: 30, dy: -60, tone: 'red' },
    { text: L.monthly, at: { actor: 'book', uv: [0.5, -0.04] }, show: [CH.cierre + 0.35, CH.cierre + 0.95], dx: 0, dy: -30 },
    { text: L.entry, at: { actor: 'ledger', uv: LEDGER_ANCHORS.entry }, show: [CH.cierre + 0.6, CH.cierre + 0.95], dx: 50, dy: 40, tone: 'green' },
    { text: L.vatChip, at: { from: { actor: 'inv', uv: INVOICE_ANCHORS.vat }, to: { actor: 'tax', uv: TAX_ANCHORS.box1 }, span: [CH.impuestos + 0.3, CH.impuestos + 0.55] }, show: [CH.impuestos + 0.26, CH.impuestos + 0.58], dx: 0, dy: 0, style: 'chip' },
    { text: L.vatFrom, at: { actor: 'inv', uv: INVOICE_ANCHORS.vat }, show: [CH.impuestos + 0.22, CH.impuestos + 0.98], dx: -10, dy: -40 },
    { text: L.vatTo, at: { actor: 'tax', uv: TAX_ANCHORS.box1 }, show: [CH.impuestos + 0.55, CH.impuestos + 0.98], dx: 30, dy: -44, tone: 'green' },
    { text: L.supplierRead, at: { actor: 'sup', uv: SUPPLIER_ANCHORS.top }, show: [CH.proveedores + 0.45, CH.proveedores + 0.98], dx: 0, dy: -28 },
    { text: L.order, at: { actor: 'sup', uv: SUPPLIER_ANCHORS.fields[1] }, show: [CH.proveedores + 0.5, CH.proveedores + 0.98], dx: -50, dy: 0, tone: 'green', desktop: true },
    { text: L.deliveryNote, at: { actor: 'sup', uv: SUPPLIER_ANCHORS.fields[2] }, show: [CH.proveedores + 0.54, CH.proveedores + 0.98], dx: -50, dy: 10, tone: 'green', desktop: true },
    { text: L.payday, at: { actor: 'sup', uv: [0.5, 1] }, show: [CH.proveedores + 0.8, CH.proveedores + 0.98], dx: 0, dy: 34 },
    ...L.chain.map((t, i) => ({
      text: t,
      at: { actor: ['p2', 'p1', 'inv'][i], uv: [0.5, -0.04] },
      show: [CH.verifactu + 0.3 + i * 0.05, CH.verifactu + 0.98] as [number, number],
      dx: 0,
      dy: -22,
      tone: 'mint' as const,
    })),
    { text: L.fingerprint, at: { link: 1 }, show: [CH.verifactu + 0.55, CH.verifactu + 0.98], dx: 0, dy: 50, tone: 'mint' },
    { text: (_T, w) => (w.size === 'medium' ? L.medium : L.small), at: { actor: 'inv', uv: [0.5, -0.04] }, show: [CH.audience + 0.25, CH.audience + 0.98], dx: 0, dy: -26 },
    { text: es.story.actions.surveyHint, at: { actor: 'inv', uv: [0.5, 1.02] }, show: [CH.survey + 0.45, CH.survey + 0.98], dx: 0, dy: 30, tone: 'green' },
  ];

  return { inv, excel, env, letters, slip, tax, sup, p1, p2, stamp, book, bars, links, road, crowd, fx, cam, labels };
}

export type Script = ReturnType<typeof buildScript>;

export type Anchor =
  | { actor: string; uv: readonly number[] }
  | { world: readonly number[] }
  | { bar: number }
  | { marker: number }
  | { link: number }
  | { from: { actor: string; uv: readonly number[] }; to: { actor: string; uv: readonly number[] }; span: [number, number] };

export type LabelSpec = {
  text: string | ((T: number, w: { size: 'small' | 'medium' }) => string);
  at: Anchor;
  show: [number, number];
  dx: number;
  dy: number;
  style?: 'pill' | 'big' | 'note' | 'chip';
  tone?: 'green' | 'red' | 'mint';
  /** Solo en pantallas anchas (en móvil se omite para no saturar). */
  desktop?: boolean;
};

/** Estados de las texturas (deterministas según T, salvo que el usuario se adelante). */
export function flags(T: number, user: { stamped: boolean; approved: boolean }) {
  const paid = T >= CH.tesoreria + 0.56 || (user.stamped && T >= CH.tesoreria);
  return {
    overdue: T >= CH.overdue + 0.44,
    paid,
    qr: T >= CH.verifactu + 0.45,
    filled: T >= CH.impuestos + 0.55,
    draft: T >= CH.impuestos + 0.74,
    // Avance de lectura (0..1) mientras la lupa recorre la hoja; cuantizado para no redibujar sin parar.
    invRead: Math.round(Math.min(1, Math.max(0, (T - CH.read - 0.45) / 0.3)) * 20) / 20,
    supRead: Math.round(Math.min(1, Math.max(0, (T - CH.proveedores - 0.3) / 0.25)) * 20) / 20,
    approved: T >= CH.proveedores + 0.72 || (user.approved && T >= CH.proveedores),
    entry: T >= CH.cierre + 0.57,
    surveyTicks: Math.max(0, Math.min(4, Math.floor((T - CH.survey - 0.38) / 0.08))),
  };
}
