// La pantalla del móvil: una interfaz de Automatta dibujada en canvas (datos de ejemplo).
// Se diseña para leerse a tamaño reducido: pocas cosas, letra grande y mucho contraste.
import es from '../../content/es';

export const SW = 390;
export const SH = 844;

const sc = es.story.screen;
const C = {
  bg: '#f5f6f3',
  card: '#ffffff',
  ink: '#14201b',
  muted: '#5f6b65',
  line: 'rgba(20,32,27,0.1)',
  green: '#1f6b4a',
  greenSoft: '#d8ebe0',
  mint: '#8fd3b2',
  red: '#c8372d',
  redSoft: '#f5dbd8',
  night: '#14201b',
};

export type ScreenState =
  | { kind: 'off' }
  | { kind: 'lock' }
  | { kind: 'wake'; p: number }
  | { kind: 'read'; p: number }
  | { kind: 'cobros'; p: number }
  | { kind: 'tesoreria'; p: number; paid: boolean }
  | { kind: 'cierre'; p: number }
  | { kind: 'impuestos'; p: number }
  | { kind: 'proveedores'; p: number; approved: boolean }
  | { kind: 'verifactu'; p: number; tamper: boolean }
  | { kind: 'audience'; size: 'small' | 'medium'; scroll: number }
  | { kind: 'survey'; ticks: number; hover: boolean };

type X = CanvasRenderingContext2D;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const euro = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

function f(x: X, w: number, px: number, stretch: 'normal' | 'wide' | 'narrow' = 'normal') {
  x.font = `${w} ${px}px "Archivo Variable", "Archivo", system-ui, sans-serif`;
  const c = x as X & { fontStretch?: string };
  if ('fontStretch' in c) c.fontStretch = stretch === 'wide' ? 'semi-expanded' : stretch === 'narrow' ? 'semi-condensed' : 'normal';
}
function t(x: X, s: string, px: number, py: number, o: { w?: number; size?: number; c?: string; a?: CanvasTextAlign; st?: 'normal' | 'wide' | 'narrow' } = {}) {
  f(x, o.w ?? 500, o.size ?? 16, o.st);
  x.fillStyle = o.c ?? C.ink;
  x.textAlign = o.a ?? 'left';
  x.textBaseline = 'alphabetic';
  x.fillText(s, px, py);
}
function rr(x: X, px: number, py: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}
function card(x: X, px: number, py: number, w: number, h: number, fill = C.card) {
  x.save();
  x.shadowColor = 'rgba(20,32,27,0.08)';
  x.shadowBlur = 18;
  x.shadowOffsetY = 6;
  x.fillStyle = fill;
  rr(x, px, py, w, h, 22);
  x.fill();
  x.restore();
}
function check(x: X, cx: number, cy: number, r: number, bg = C.green, fg = '#fff', k = 1) {
  x.fillStyle = bg;
  x.beginPath();
  x.arc(cx, cy, r, 0, Math.PI * 2);
  x.fill();
  if (k <= 0) return;
  x.strokeStyle = fg;
  x.lineWidth = r * 0.3;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.beginPath();
  x.moveTo(cx - r * 0.42, cy + r * 0.02);
  x.lineTo(cx - r * 0.1, cy + r * 0.34);
  if (k > 0.5) x.lineTo(cx + r * 0.45, cy - r * 0.3);
  x.stroke();
}
function pill(x: X, s: string, px: number, py: number, bg: string, fg: string, size = 15) {
  f(x, 600, size);
  const w = x.measureText(s).width + 26;
  x.fillStyle = bg;
  rr(x, px, py, w, size + 16, (size + 16) / 2);
  x.fill();
  t(x, s, px + 13, py + size + 5, { w: 600, size, c: fg });
  return w;
}
function statusBar(x: X, dark = false) {
  const c = dark ? '#f5f6f3' : C.ink;
  t(x, sc.time, 36, 38, { w: 600, size: 17, c });
  // Batería y cobertura, simples
  x.fillStyle = c;
  rr(x, 330, 26, 26, 13, 4);
  x.globalAlpha = 0.9;
  x.fill();
  x.globalAlpha = 1;
  for (let i = 0; i < 4; i++) x.fillRect(288 + i * 6, 36 - i * 3, 4, 3 + i * 3);
}
function header(x: X, title: string, sub?: string) {
  statusBar(x);
  // Logo de la app
  x.fillStyle = C.green;
  rr(x, 24, 70, 34, 34, 9);
  x.fill();
  x.strokeStyle = '#f5f6f3';
  x.lineWidth = 3.4;
  x.lineCap = 'round';
  x.beginPath();
  x.arc(41, 88, 8.5, -0.5, Math.PI * 1.25);
  x.stroke();
  t(x, sc.app, 68, 94, { w: 600, size: 17 });
  // El título se ajusta al ancho de la pantalla.
  let size = 34;
  do {
    f(x, 650, size, 'wide');
    size -= 1;
  } while (x.measureText(title).width > SW - 48 && size > 20);
  t(x, title, 24, 158, { w: 650, size: size + 1, st: 'wide' });
  if (sub) t(x, sub, 24, 188, { size: 16, c: C.muted });
}

// ---------------------------------------------------------------- pantallas

function lock(x: X) {
  const g = x.createLinearGradient(0, 0, 0, SH);
  g.addColorStop(0, '#1f6b4a');
  g.addColorStop(1, '#0f2a1f');
  x.fillStyle = g;
  x.fillRect(0, 0, SW, SH);
  // Brillos suaves de fondo de pantalla
  const r = x.createRadialGradient(300, 180, 10, 300, 180, 360);
  r.addColorStop(0, 'rgba(143,211,178,0.35)');
  r.addColorStop(1, 'rgba(143,211,178,0)');
  x.fillStyle = r;
  x.fillRect(0, 0, SW, SH);
  statusBar(x, true);
  t(x, sc.date, SW / 2, 120, { w: 500, size: 18, c: 'rgba(245,246,243,0.85)', a: 'center' });
  t(x, sc.time, SW / 2, 214, { w: 650, size: 92, c: '#f5f6f3', a: 'center', st: 'wide' });
  // Notificación
  x.save();
  x.fillStyle = 'rgba(245,246,243,0.92)';
  rr(x, 16, 520, SW - 32, 132, 26);
  x.fill();
  x.restore();
  x.fillStyle = C.green;
  rr(x, 32, 538, 34, 34, 9);
  x.fill();
  check(x, 49, 555, 9, C.green, '#fff');
  t(x, sc.app.toUpperCase(), 78, 560, { w: 600, size: 13, c: C.muted });
  t(x, sc.now, SW - 34, 560, { size: 13, c: C.muted, a: 'right' });
  t(x, sc.notifTitle, 32, 600, { w: 650, size: 21 });
  wrap(x, sc.notifText, 32, 626, SW - 70, 19, { size: 16, c: C.ink });
}

function wrap(x: X, s: string, px: number, py: number, maxW: number, lh: number, o: { size: number; c: string; w?: number }) {
  f(x, o.w ?? 450, o.size);
  const words = s.split(' ');
  let line = '';
  let y = py;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (x.measureText(test).width > maxW && line) {
      t(x, line, px, y, { size: o.size, c: o.c, w: o.w ?? 450 });
      line = w;
      y += lh;
    } else line = test;
  }
  if (line) t(x, line, px, y, { size: o.size, c: o.c, w: o.w ?? 450 });
}

function wake(x: X, p: number) {
  x.fillStyle = '#000';
  x.fillRect(0, 0, SW, SH);
  const k = ease(p * 1.6);
  x.globalAlpha = k;
  x.fillStyle = C.bg;
  x.fillRect(0, 0, SW, SH);
  x.globalAlpha = 1;
  const s = 70 + 20 * k;
  x.globalAlpha = clamp(p * 3 - 0.3);
  x.fillStyle = C.green;
  rr(x, SW / 2 - s / 2, SH / 2 - s / 2 - 30, s, s, s * 0.26);
  x.fill();
  x.strokeStyle = '#f5f6f3';
  x.lineWidth = s * 0.1;
  x.lineCap = 'round';
  x.beginPath();
  x.arc(SW / 2, SH / 2 - 30, s * 0.25, -0.5 + p * 4, Math.PI * 1.25 + p * 4);
  x.stroke();
  t(x, sc.app, SW / 2, SH / 2 + 60, { w: 650, size: 30, a: 'center', st: 'wide' });
  x.globalAlpha = 1;
}

/** Filas de datos leídos (se rellenan con `p`). Devuelve la posición vertical de cada valor. */
export const READ_ROWS_Y = [336, 412, 488, 564];
function read(x: X, p: number) {
  header(x, sc.newInvoice, sc.readFrom);
  card(x, 16, 220, SW - 32, 390);
  t(x, 'F-2041', 40, 266, { w: 650, size: 22, st: 'wide' });
  pill(x, '4.000,00 €', 230, 244, C.greenSoft, C.green, 16);
  const vals = es.story.labels.fields;
  sc.fieldNames.forEach((name, i) => {
    const y = READ_ROWS_Y[i];
    x.fillStyle = C.line;
    x.fillRect(40, y - 36, SW - 80, 1);
    t(x, name, 40, y, { size: 16, c: C.muted });
    const k = clamp(p * 4.5 - i * 0.9 - 0.4);
    if (k > 0) {
      x.globalAlpha = k;
      t(x, vals[i], SW - 74, y, { w: 650, size: 20, a: 'right' });
      check(x, SW - 52, y - 7, 11, C.green, '#fff', k);
      x.globalAlpha = 1;
    } else {
      x.fillStyle = 'rgba(20,32,27,0.07)';
      rr(x, SW - 190, y - 20, 140, 24, 8);
      x.fill();
    }
  });
}

function cobros(x: X, p: number) {
  header(x, sc.collections);
  card(x, 16, 196, SW - 32, 120);
  t(x, es.world.invoiceA.client, 40, 240, { w: 600, size: 18 });
  t(x, '4.000,00 €', 40, 290, { w: 650, size: 36, st: 'wide' });
  const step = Math.min(3, Math.floor(p * 3.6));
  const states = [sc.overdue, ...sc.reminders.map((r) => r[1])];
  f(x, 600, 14);
  const label = step === 0 ? sc.overdue : states[step];
  pill(x, label, SW - 40 - (x.measureText(label).width + 26), 216, step === 0 ? C.redSoft : C.greenSoft, step === 0 ? C.red : C.green, 14);
  // Línea de tiempo
  const top = 380;
  x.fillStyle = C.line;
  x.fillRect(51, top, 2, 300);
  x.fillStyle = C.green;
  x.fillRect(51, top, 2, 300 * clamp(p * 1.15));
  sc.reminders.forEach(([day, label, status], i) => {
    const y = top + 20 + i * 130;
    const on = p * 3.6 > i + 1;
    if (on) check(x, 52, y, 16, i === 2 ? C.red : C.green);
    else {
      x.fillStyle = '#fff';
      x.strokeStyle = 'rgba(20,32,27,0.25)';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(52, y, 14, 0, Math.PI * 2);
      x.fill();
      x.stroke();
    }
    t(x, day, 86, y - 6, { w: 650, size: 22, c: on ? C.ink : C.muted });
    t(x, label, 86, y + 22, { size: 17, c: on ? C.ink : C.muted });
    if (on) pill(x, status, 86, y + 38, i === 2 ? C.redSoft : C.greenSoft, i === 2 ? C.red : C.green, 13);
  });
}

function tesoreria(x: X, p: number, paid: boolean) {
  header(x, sc.bank);
  // La transferencia entra deslizándose
  const k = ease(p * 3);
  x.save();
  x.translate((1 - k) * 340, 0);
  x.globalAlpha = k;
  card(x, 16, 196, SW - 32, 150, C.ink);
  t(x, sc.transfer, 40, 236, { size: 15, c: 'rgba(245,246,243,0.7)' });
  t(x, '+4.000,00 €', 40, 284, { w: 650, size: 36, c: C.mint, st: 'wide' });
  t(x, es.world.invoiceA.client, 40, 318, { size: 16, c: '#f5f6f3' });
  x.restore();
  if (paid) {
    pill(x, `✓ ${sc.matched}`, 24, 362, C.greenSoft, C.green, 16);
  }
  // Caja a 90 días
  const q = clamp((p - 0.45) / 0.5);
  if (q > 0) {
    card(x, 16, 420, SW - 32, 360);
    t(x, sc.cash, 40, 462, { w: 600, size: 18 });
    const cash = [30, 33, 31, 35, 32, 27, 21, 13, 19, 26, 30, 33, 36];
    const bw = (SW - 96) / cash.length;
    cash.forEach((v, i) => {
      const h = (v / 36) * 200 * ease(q * 1.6 - i * 0.05);
      const red = i === 7;
      x.fillStyle = red ? C.red : i === 0 && paid ? '#2a8a61' : C.green;
      x.globalAlpha = red ? 1 : 0.85;
      rr(x, 48 + i * bw + bw * 0.15, 700 - h, bw * 0.7, Math.max(2, h), 5);
      x.fill();
      x.globalAlpha = 1;
    });
    if (q > 0.7) {
      x.globalAlpha = clamp((q - 0.7) * 4);
      pill(x, sc.tight, 40, 714, C.redSoft, C.red, 14);
      x.globalAlpha = 1;
    }
  }
}

function cierre(x: X, p: number) {
  header(x, sc.month);
  sc.kpis.forEach(([label, value], i) => {
    const y = 210 + i * 132;
    card(x, 16, y, SW - 32, 112, i === 2 ? C.ink : C.card);
    t(x, String(label), 40, y + 42, { size: 16, c: i === 2 ? 'rgba(245,246,243,0.7)' : C.muted });
    t(x, euro((value as number) * ease(p * 1.8 - i * 0.15)), 40, y + 90, { w: 650, size: 38, c: i === 2 ? C.mint : C.ink, st: 'wide' });
  });
  const k = clamp(p * 3 - 1.4);
  if (k > 0) {
    x.globalAlpha = k;
    card(x, 16, 620, SW - 32, 84);
    check(x, 50, 662, 14);
    t(x, sc.entry, 76, 668, { w: 600, size: 17 });
    x.globalAlpha = 1;
  }
}

export const TAX_BOX_Y = [306, 406, 506];
function impuestos(x: X, p: number) {
  header(x, sc.taxTitle, sc.taxSub);
  sc.taxBoxes.forEach(([n, label, value], i) => {
    const y = TAX_BOX_Y[i];
    const last = i === 2;
    card(x, 16, y - 66, SW - 32, 88, last ? C.ink : C.card);
    t(x, `${n}  ${label}`, 40, y - 30, { size: 15, c: last ? 'rgba(245,246,243,0.7)' : C.muted });
    const k = clamp(p * 4 - i * 0.7 - 0.3);
    if (k > 0) {
      x.globalAlpha = k;
      t(x, `${value} €`, SW - 40, y + 4, { w: 650, size: 26, c: last ? C.mint : C.ink, a: 'right', st: 'wide' });
      x.globalAlpha = 1;
    }
  });
  if (p > 0.75) {
    x.globalAlpha = clamp((p - 0.75) * 5);
    pill(x, `✓ ${sc.draft}`, 24, 580, C.greenSoft, C.green, 16);
    x.globalAlpha = 1;
  }
}

export const SUP_ROWS_Y = [300, 380, 460];
function proveedores(x: X, p: number, approved: boolean) {
  header(x, sc.supplierTitle);
  card(x, 16, 196, SW - 32, 330);
  const vals = es.story.labels.supplierFields;
  ['Proveedor', 'Total', 'IVA'].forEach((name, i) => {
    const y = SUP_ROWS_Y[i];
    t(x, name, 40, y - 40, { size: 15, c: C.muted });
    const k = clamp(p * 4 - i * 0.7);
    if (k > 0) {
      x.globalAlpha = k;
      t(x, vals[i], 40, y - 8, { w: 650, size: 24, st: i === 0 ? 'normal' : 'wide' });
      x.globalAlpha = 1;
    }
  });
  let px = 40;
  sc.supplierChecks.forEach((c, i) => {
    if (p * 4 > 2.4 + i * 0.4) px += pill(x, `✓ ${c}`, px, 470, C.greenSoft, C.green, 15) + 10;
  });
  // Botón de aprobar
  const btnY = 600;
  x.fillStyle = approved ? C.green : C.ink;
  rr(x, 16, btnY, SW - 32, 74, 37);
  x.fill();
  t(x, approved ? `✓ ${sc.approved}` : sc.approve, SW / 2, btnY + 47, { w: 650, size: 24, c: '#f5f6f3', a: 'center' });
  if (approved) t(x, sc.payday, SW / 2, btnY + 116, { size: 16, c: C.muted, a: 'center' });
}

function verifactu(x: X, p: number, tamper: boolean) {
  x.fillStyle = C.night;
  x.fillRect(0, 0, SW, SH);
  statusBar(x, true);
  t(x, sc.verifactuTitle, 24, 140, { w: 650, size: 32, c: '#f5f6f3', st: 'wide' });
  sc.chain.forEach((id, i) => {
    const k = ease(p * 3 - i * 0.5);
    const y = 190 + i * 160;
    x.globalAlpha = k;
    x.fillStyle = 'rgba(245,246,243,0.07)';
    rr(x, 16, y, SW - 32, 120, 22);
    x.fill();
    t(x, id, 40, y + 48, { w: 650, size: 26, c: '#f5f6f3', st: 'wide' });
    t(x, `#${(0x9a3f + i * 0x1c7b).toString(16)}…${(0x2e1 + i * 0x3b).toString(16)}`, 40, y + 86, { size: 15, c: C.mint, st: 'narrow' });
    check(x, SW - 56, y + 60, 18, C.mint, C.night);
    // Eslabón hacia la siguiente
    if (i < 2) {
      x.strokeStyle = C.mint;
      x.lineWidth = 3;
      x.beginPath();
      x.moveTo(SW / 2, y + 122);
      x.lineTo(SW / 2, y + 158);
      x.stroke();
    }
    x.globalAlpha = 1;
  });
  if (tamper) {
    x.fillStyle = C.red;
    rr(x, 16, 690, SW - 32, 84, 22);
    x.fill();
    t(x, sc.tamperNo, SW / 2, 740, { w: 600, size: 16, c: '#fff', a: 'center' });
  } else {
    t(x, sc.locked, SW / 2, 720, { size: 16, c: 'rgba(245,246,243,0.75)', a: 'center' });
  }
}

function audience(x: X, size: 'small' | 'medium', scroll: number) {
  const medium = size === 'medium';
  header(x, medium ? sc.mediumTitle : sc.smallTitle, medium ? sc.mediumSub : sc.smallSub);
  pill(x, medium ? sc.mediumLine : sc.smallLine, 24, 214, C.greenSoft, C.green, 15);
  const clients = ['Talleres Ejemplo SL', 'Distribuciones Muestra SA', 'Ingeniería Ficticia SL', 'Logística Demo SL', 'Construcciones Prueba SA', 'Servicios Modelo SL'];
  x.save();
  x.beginPath();
  x.rect(0, 260, SW, SH - 300);
  x.clip();
  const n = medium ? 40 : 3;
  const off = medium ? (scroll * 90) % 90 : 0;
  for (let i = 0; i < n; i++) {
    const y = 270 + i * 90 - off;
    if (y > SH) break;
    card(x, 16, y, SW - 32, 76);
    t(x, `F-${2041 - i}`, 36, y + 32, { w: 650, size: 18, st: 'wide' });
    t(x, clients[i % clients.length], 36, y + 58, { size: 14, c: C.muted });
    check(x, SW - 52, y + 38, 14);
  }
  x.restore();
}

function survey(x: X, ticks: number, hover: boolean) {
  header(x, sc.surveyTitle);
  es.survey.bullets.forEach((b, i) => {
    const y = 200 + i * 110;
    const on = i < ticks;
    card(x, 16, y, SW - 32, 92);
    if (on) check(x, 48, y + 46, 15);
    else {
      x.strokeStyle = 'rgba(20,32,27,0.3)';
      x.lineWidth = 2;
      rr(x, 34, y + 32, 28, 28, 7);
      x.stroke();
    }
    t(x, b.title, 78, y + 42, { w: 650, size: 20 });
    wrap(x, b.text, 78, y + 66, SW - 120, 18, { size: 14, c: C.muted });
  });
  const btnY = 664;
  x.fillStyle = hover ? C.green : C.ink;
  rr(x, 16, btnY, SW - 32, 76, 38);
  x.fill();
  t(x, `${sc.surveyCta} →`, SW / 2, btnY + 48, { w: 650, size: 22, c: '#f5f6f3', a: 'center' });
}

/** Dibuja la pantalla en `x` (escalado a SW × SH). */
export function drawScreen(x: X, s: ScreenState) {
  x.save();
  x.fillStyle = C.bg;
  x.fillRect(0, 0, SW, SH);
  switch (s.kind) {
    case 'off':
      x.fillStyle = '#050706';
      x.fillRect(0, 0, SW, SH);
      break;
    case 'lock':
      lock(x);
      break;
    case 'wake':
      wake(x, s.p);
      break;
    case 'read':
      read(x, s.p);
      break;
    case 'cobros':
      cobros(x, s.p);
      break;
    case 'tesoreria':
      tesoreria(x, s.p, s.paid);
      break;
    case 'cierre':
      cierre(x, s.p);
      break;
    case 'impuestos':
      impuestos(x, s.p);
      break;
    case 'proveedores':
      proveedores(x, s.p, s.approved);
      break;
    case 'verifactu':
      verifactu(x, s.p, s.tamper);
      break;
    case 'audience':
      audience(x, s.size, s.scroll);
      break;
    case 'survey':
      survey(x, s.ticks, s.hover);
      break;
  }
  // Isla dinámica
  if (s.kind !== 'off') {
    x.fillStyle = '#000';
    rr(x, SW / 2 - 62, 14, 124, 36, 18);
    x.fill();
  }
  x.restore();
}
