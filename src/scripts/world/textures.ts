// Texturas de los personajes de la historia, dibujadas en canvas (datos de ejemplo).
// Coordenadas lógicas: hoja A4 de W × H (340 × 481); el canvas real se escala.
import es from '../../content/es';
import { C, W, H, type Ctx, text, bars, roundRect, hr, check, stamp, sticky } from './atlas';

const d = es.world;
const s = es.story;

export type Paper = { canvas: HTMLCanvasElement; ctx: Ctx; w: number; h: number };

/** Crea un lienzo con coordenadas lógicas w × h y resolución `px` de ancho. */
export function paper(w: number, h: number, px: number): Paper {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(px);
  canvas.height = Math.round((px * h) / w);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(canvas.width / w, canvas.height / h);
  return { canvas, ctx, w, h };
}

function clear(p: Paper, color = '#ffffff') {
  p.ctx.save();
  p.ctx.setTransform(1, 0, 0, 1, 0, 0);
  p.ctx.fillStyle = color;
  p.ctx.fillRect(0, 0, p.canvas.width, p.canvas.height);
  p.ctx.restore();
}

/** Código QR de mentira (patrón determinista) para Verifactu. */
function qr(ctx: Ctx, x: number, y: number, size: number, seed: number) {
  const n = 21;
  const c = size / n;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 3, y - 3, size + 6, size + 6);
  ctx.fillStyle = C.ink;
  let r = seed;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const finder = (i < 7 && j < 7) || (i < 7 && j > n - 8) || (i > n - 8 && j < 7);
      if (finder) {
        const fi = i < 7 ? i : i - (n - 7);
        const fj = j < 7 ? j : j - (n - 7);
        const ring = Math.max(Math.abs(fi - 3), Math.abs(fj - 3));
        if (ring === 3 || ring <= 1) ctx.fillRect(x + j * c, y + i * c, c + 0.2, c + 0.2);
      } else if (rnd() > 0.52) ctx.fillRect(x + j * c, y + i * c, c + 0.2, c + 0.2);
    }
}

// ---------- F-2041 (la protagonista) ----------

/** Puntos de la factura (u, v desde arriba a la izquierda, 0..1) que señalan las etiquetas. */
export const INVOICE_ANCHORS = {
  client: [0.08, 0.28],
  total: [0.9, 0.69],
  vat: [0.9, 0.59],
  due: [0.08, 0.9],
  stamp: [0.64, 0.87],
  top: [0.5, -0.06],
  number: [0.2, 0.15],
} as const;

export type InvoiceState = { overdue: boolean; paid: boolean; qr: boolean; read?: number };

type InvoiceData = { kind: string; number: string; issuer: string; client: string; concept: string; base: string; vat: string; total: string; due: string };

export function drawInvoice(p: Paper, st: InvoiceState, v: InvoiceData = d.invoiceA) {
  const ctx = p.ctx;
  clear(p);
  const m = 26;
  text(ctx, v.kind, m, 44, { w: 480, px: 13, c: C.muted });
  text(ctx, v.number, m, 76, { w: 620, px: 30, st: 'expanded' });
  text(ctx, v.issuer, W - m, 44, { w: 600, px: 13, align: 'right' });
  bars(ctx, W - m - 92, 56, 92, 2, 10);
  hr(ctx, m, 96, W - m * 2);
  text(ctx, 'Cliente', m, 120, { px: 11, c: C.muted });
  text(ctx, v.client, m, 138, { w: 560, px: 14 });
  bars(ctx, m, 150, 150, 2, 10);
  hr(ctx, m, 186, W - m * 2);
  text(ctx, v.concept, m, 210, { px: 13 });
  text(ctx, v.base, W - m, 210, { px: 13, align: 'right', st: 'condensed' });
  bars(ctx, m, 224, 180, 3, 12);
  text(ctx, 'IVA 21 %', m, 284, { px: 12, c: C.muted });
  text(ctx, v.vat, W - m, 284, { px: 12, c: C.muted, align: 'right', st: 'condensed' });
  hr(ctx, m, 300, W - m * 2, 'rgba(20,32,27,0.3)');
  text(ctx, 'Total', m, 330, { w: 560, px: 14 });
  text(ctx, v.total, W - m, 332, { w: 640, px: 22, align: 'right', st: 'expanded' });
  bars(ctx, m, 372, st.qr ? 190 : W - m * 2, 3, 12);
  text(ctx, v.due, m, 438, { w: 520, px: 13, c: st.overdue && !st.paid ? C.red : C.muted });
  // Campos que el lector de Automatta ya ha leído (se marcan a medida que pasa la lupa).
  const read = st.read ?? 0;
  const boxes: [number, number, number, number][] = [
    [m - 6, 108, W - m * 2 + 12, 48],
    [m - 6, 266, W - m * 2 + 12, 26],
    [m - 6, 308, W - m * 2 + 12, 34],
    [m - 6, 422, 190, 24],
  ];
  if (read > 0 && !st.paid) {
    for (const [x, y, w, h] of boxes) {
      const k = Math.max(0, Math.min(1, (read * H - y) / 40));
      if (k <= 0) continue;
      ctx.globalAlpha = k;
      ctx.fillStyle = 'rgba(31,107,74,0.07)';
      roundRect(ctx, x, y, w, h, 5);
      ctx.fill();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  if (st.qr) {
    qr(ctx, W - m - 62, 362, 62, 2041);
    text(ctx, 'VERI*FACTU', W - m - 31, 440, { w: 640, px: 9, align: 'center', st: 'expanded' });
  }
  if (st.paid) stamp(ctx, d.stamps.paid, C.green, W * 0.6, 418, -0.16, 28, '19 oct');
  else if (st.overdue) stamp(ctx, d.stamps.overdue, C.red, W * 0.62, 420, -0.12, 26);
}

/** El dorso de F-2041: la encuesta. `ticks` = casillas marcadas (0..4). */
export function drawSurveyBack(p: Paper, ticks: number) {
  const ctx = p.ctx;
  const v = es.survey;
  clear(p);
  const m = 26;
  text(ctx, 'Encuesta Automatta', m, 44, { w: 480, px: 13, c: C.muted });
  text(ctx, es.story.chapters.surveyTitle, m, 76, { w: 640, px: 22, st: 'expanded' });
  hr(ctx, m, 96, W - m * 2, 'rgba(20,32,27,0.3)');
  v.bullets.forEach((b, i) => {
    const y = 136 + i * 74;
    const on = i < ticks;
    ctx.fillStyle = on ? C.green : '#fff';
    ctx.strokeStyle = on ? C.green : 'rgba(20,32,27,0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, m, y - 15, 20, 20, 4);
    ctx.fill();
    ctx.stroke();
    if (on) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m + 5, y - 5);
      ctx.lineTo(m + 9, y - 1);
      ctx.lineTo(m + 15.5, y - 9);
      ctx.stroke();
    }
    text(ctx, b.title, m + 34, y, { w: 600, px: 16 });
    text(ctx, b.text, m + 34, y + 20, { px: 11.5, c: C.muted });
    if (i < v.bullets.length - 1) hr(ctx, m, y + 40, W - m * 2);
  });
  ctx.fillStyle = C.ink;
  roundRect(ctx, m, 418, W - m * 2, 40, 7);
  ctx.fill();
  text(ctx, `${v.cta} →`, W / 2, 444, { w: 600, px: 15, c: '#f5f6f3', align: 'center' });
}

// ---------- Excel tecleado a mano ----------

const ROWS = [
  ['F-2041', 'Talleres Ejemplo', '4.000,00', '#N/A'],
  ['F-2040', 'Distrib. Muestra', '6.000,00', '1.041'],
  ['F-2039', 'Ing. Ficticia', '2.500,00', '¿?'],
  ['F-2038', 'Logística Demo', '3.000,00', '520,6'],
  ['F-2037', 'Construcc. Prueba', '1.150,00', '#N/A'],
  ['F-2036', 'Servicios Modelo', '640,00', '134,4'],
  ['F-2035', 'Talleres Ejemplo', '2.420,00', ''],
];

export const EXCEL_ANCHORS = { top: [0.5, 0.06], typo: [0.86, 0.23] } as const;

/** `progress` 0..1: cuántos caracteres se han tecleado ya. */
export function drawExcel(p: Paper, progress: number, blink: boolean) {
  const ctx = p.ctx;
  clear(p);
  ctx.fillStyle = C.excel;
  ctx.fillRect(0, 0, W, 34);
  text(ctx, d.sheet.file, 14, 22, { w: 560, px: 12, c: '#fff' });
  const cw = [56, 116, 82, 58];
  const top = 50;
  const rh = 34;
  let x = 12;
  ['Factura', 'Cliente', 'Importe', 'IVA'].forEach((c, i) => {
    text(ctx, c, x + 5, top + 18, { w: 560, px: 11, c: C.muted });
    x += cw[i];
  });
  const total = ROWS.flat().join('').length;
  let budget = Math.floor(progress * total);
  let caret: [number, number] | null = null;
  ROWS.forEach((row, r) => {
    const y = top + rh * (r + 1);
    hr(ctx, 12, y, W - 24);
    let cx = 12;
    row.forEach((cell, ci) => {
      const shown = cell.slice(0, Math.max(0, Math.min(cell.length, budget)));
      budget -= cell.length;
      const bad = cell === '#N/A' || cell === '¿?';
      if (bad && shown.length === cell.length) {
        ctx.fillStyle = C.redSoft;
        ctx.fillRect(cx + 1, y + 2, cw[ci] - 2, rh - 3);
      }
      const right = ci >= 2;
      text(ctx, shown, right ? cx + cw[ci] - 6 : cx + 5, y + 22, {
        px: 12,
        st: 'condensed',
        align: right ? 'right' : 'left',
        c: bad ? C.red : C.ink,
        w: bad ? 640 : 450,
      });
      if (!caret && shown.length < cell.length) caret = [right ? cx + cw[ci] - 4 : cx + 6 + ctx.measureText(shown).width, y + 8];
      cx += cw[ci];
    });
  });
  // Rejilla y cursor de texto
  ctx.fillStyle = C.line;
  x = 12;
  for (const w of cw) {
    ctx.fillRect(x, top, 1, rh * (ROWS.length + 1));
    x += w;
  }
  if (caret && blink) {
    ctx.fillStyle = C.ink;
    ctx.fillRect(caret[0], caret[1], 1.6, 18);
  }
  bars(ctx, 16, top + rh * (ROWS.length + 1) + 24, W - 32, 5, 13);
}

// ---------- Sobre ----------

export function drawEnvelope(p: Paper) {
  const ctx = p.ctx;
  clear(p, '#fbfaf6');
  // Ventana con la dirección
  ctx.strokeStyle = 'rgba(20,32,27,0.18)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 30, 110, 200, 76, 6);
  ctx.stroke();
  text(ctx, d.invoiceA.client, 44, 140, { w: 600, px: 15 });
  bars(ctx, 44, 152, 150, 2, 11);
  // Remitente y sello postal
  text(ctx, d.invoiceA.issuer, 30, 44, { w: 560, px: 12, c: C.muted });
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  roundRect(ctx, 262, 26, 52, 60, 4);
  ctx.stroke();
  check(ctx, 288, 56, 12);
}

export function drawFlap(p: Paper) {
  clear(p, '#f1efe8');
}

// ---------- Recordatorios ----------

export function drawLetter(p: Paper, i: number) {
  const ctx = p.ctx;
  clear(p);
  const colors = [C.green, C.ink, C.red];
  const titles = ['Recordatorio amable', 'Recordatorio firme', 'Aviso: llamar al cliente'];
  ctx.fillStyle = colors[i];
  ctx.fillRect(0, 0, 8, p.h);
  text(ctx, titles[i], 26, 44, { w: 620, px: 18, st: 'expanded' });
  text(ctx, `${d.invoiceA.number} · ${d.invoiceA.total}`, 26, 68, { px: 13, c: C.muted, st: 'condensed' });
  bars(ctx, 26, 92, p.w - 60, 6, 15);
  if (i === 1) {
    ctx.fillStyle = C.redSoft;
    roundRect(ctx, 26, 196, 140, 26, 13);
    ctx.fill();
    text(ctx, 'Factura adjunta', 40, 214, { w: 600, px: 12, c: C.red });
  }
  if (i === 2) {
    // Teléfono
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.w - 50, 200, 22, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, '☎', p.w - 50, 208, { px: 22, c: C.red, align: 'center' });
  }
}

// ---------- Transferencia ----------

export function drawSlip(p: Paper) {
  const ctx = p.ctx;
  clear(p);
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, p.w, 44);
  text(ctx, 'Transferencia recibida', 22, 28, { w: 620, px: 15, c: '#f5f6f3', st: 'expanded' });
  text(ctx, 'Ordenante', 22, 74, { px: 11, c: C.muted });
  text(ctx, d.invoiceA.client, 22, 92, { w: 560, px: 14 });
  text(ctx, 'Concepto', 22, 120, { px: 11, c: C.muted });
  text(ctx, `Factura ${d.invoiceA.number}`, 22, 138, { w: 560, px: 14 });
  text(ctx, '+4.000,00 €', p.w - 22, 128, { w: 680, px: 28, c: C.green, align: 'right', st: 'expanded' });
}

// ---------- Modelo 303 ----------

export const TAX_ANCHORS = { box1: [0.9, 0.38], top: [0.5, -0.05], stamp: [0.6, 0.9] } as const;

export function drawTax(p: Paper, filled: boolean, draft: boolean) {
  const ctx = p.ctx;
  const v = d.tax;
  clear(p);
  const m = 24;
  text(ctx, v.title, m, 50, { w: 680, px: 28, st: 'expanded' });
  text(ctx, v.subtitle, m, 72, { px: 13, c: C.muted });
  hr(ctx, m, 88, W - m * 2, 'rgba(20,32,27,0.3)');
  bars(ctx, m, 104, W - m * 2, 3, 12);
  v.boxes.forEach(([label, value], i) => {
    const y = 170 + i * 72;
    text(ctx, `${String(i + 1).padStart(2, '0')}  ${label}`, m, y, { px: 12, c: C.muted });
    ctx.strokeStyle = filled && i === 0 ? C.green : 'rgba(20,32,27,0.35)';
    ctx.lineWidth = filled && i === 0 ? 2.2 : 1.2;
    roundRect(ctx, m, y + 10, W - m * 2, 34, 4);
    ctx.stroke();
    if (filled) {
      if (i === 2) {
        ctx.fillStyle = C.ink;
        roundRect(ctx, m, y + 10, W - m * 2, 34, 4);
        ctx.fill();
      }
      text(ctx, value, W - m - 12, y + 33, { w: 620, px: 16, align: 'right', c: i === 2 ? '#f5f6f3' : C.ink, st: 'condensed' });
    }
  });
  if (draft) stamp(ctx, d.stamps.draft, C.green, W * 0.58, 440, -0.1, 22);
  else text(ctx, v.deadline, m, 430, { w: 640, px: 16, c: C.red });
}

// ---------- Factura de proveedor ----------

export const SUPPLIER_ANCHORS = { fields: [[0.1, 0.33], [0.1, 0.43], [0.1, 0.54], [0.1, 0.64]], stamp: [0.64, 0.92], top: [0.5, -0.05] } as const;

export function drawSupplier(p: Paper, readProgress: number, approved: boolean) {
  const ctx = p.ctx;
  const v = d.supplier;
  clear(p);
  const m = 26;
  ctx.fillStyle = C.redSoft;
  roundRect(ctx, m, 22, 40, 22, 4);
  ctx.fill();
  text(ctx, 'PDF', m + 20, 38, { w: 700, px: 12, c: C.red, align: 'center' });
  text(ctx, v.kind, m, 76, { px: 12, c: C.muted });
  text(ctx, v.issuer, m, 100, { w: 620, px: 19, st: 'expanded' });
  bars(ctx, m, 114, 160, 3, 11);
  const values = [v.issuer, v.total, '21 % (210,00 €)', 'en 30 días'];
  v.fields.forEach((f, i) => {
    const y = 176 + i * 50;
    const read = readProgress * H > y;
    if (read) {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      roundRect(ctx, m - 6, y - 22, W - m * 2 + 12, 40, 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(31,107,74,0.06)';
      ctx.fill();
    }
    text(ctx, f, m, y - 3, { px: 11, c: C.muted });
    text(ctx, values[i], m, y + 12, { w: 560, px: 13, st: 'condensed' });
  });
  bars(ctx, m, 390, W - m * 2, 3, 12);
  if (approved) stamp(ctx, d.stamps.approved, C.green, W * 0.64, 446, -0.14, 26);
  else if (readProgress <= 0) sticky(ctx, v.note, W - 150, 360, 0.08);
}

// ---------- Libro mayor ----------

export const LEDGER_ANCHORS = { entry: [0.5, 0.52], top: [0.5, 0.08] } as const;

export function drawLedger(p: Paper, side: 'left' | 'right', entry: boolean) {
  const ctx = p.ctx;
  clear(p, '#fbfbf7');
  const m = 26;
  if (side === 'left') {
    text(ctx, 'Libro mayor', m, 48, { w: 680, px: 22, st: 'expanded' });
    text(ctx, 'Octubre', m, 72, { px: 13, c: C.muted });
  } else {
    text(ctx, 'Ventas · cobros', m, 48, { w: 600, px: 15 });
  }
  hr(ctx, m, 88, p.w - m * 2, 'rgba(20,32,27,0.3)');
  const rows = side === 'left' ? 11 : 10;
  for (let r = 0; r < rows; r++) {
    const y = 120 + r * 30;
    hr(ctx, m, y + 10, p.w - m * 2);
    const isEntry = side === 'right' && r === 4;
    if (isEntry && entry) {
      ctx.fillStyle = C.greenSoft;
      ctx.fillRect(m - 4, y - 12, p.w - m * 2 + 8, 26);
      text(ctx, `${d.invoiceA.number} · ${d.invoiceA.client}`, m, y + 4, { w: 600, px: 12, st: 'condensed' });
      text(ctx, d.invoiceA.total, p.w - m, y + 4, { w: 640, px: 12, align: 'right', st: 'condensed' });
      check(ctx, p.w - m - 96, y - 1, 7);
    } else if (!isEntry) {
      bars(ctx, m, y - 4, 140, 1, 0, 'rgba(20,32,27,0.16)');
      bars(ctx, p.w - m - 70, y - 4, 70, 1, 0, 'rgba(20,32,27,0.16)');
    }
  }
}

// ---------- Facturas anteriores (cadena de Verifactu) ----------

export function drawPrevious(p: Paper, n: number) {
  drawInvoice(p, { overdue: false, paid: true, qr: true }, { ...d.invoiceA, number: `F-20${n}`, client: n === 39 ? 'Ingeniería Ficticia SL' : 'Distribuciones Muestra SA', total: n === 39 ? '2.500,00 €' : '6.000,00 €', base: n === 39 ? '2.066,12' : '4.958,68', vat: n === 39 ? '433,88' : '1.041,32', concept: n === 39 ? 'Instalación eléctrica' : 'Mantenimiento anual', due: n === 39 ? 'Cobrada el 30 sep' : 'Cobrada el 10 oct' });
}

export { s as storyCopy };


// ---------- Materiales procedurales ----------

/** Relieve de fibra de papel (mapa de normales en tonos neutros). */
export function paperFibreNormal(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const h = new Float32Array(size * size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < h.length; i++) h[i] = rnd();
  // Fibras: trazos cortos en direcciones aleatorias
  for (let f = 0; f < size * 6; f++) {
    let x = rnd() * size;
    let y = rnd() * size;
    const a = rnd() * Math.PI;
    for (let k = 0; k < 14; k++) {
      x = (x + Math.cos(a) + size) % size;
      y = (y + Math.sin(a) + size) % size;
      h[(y | 0) * size + (x | 0)] += 0.8;
    }
  }
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const at = (xx: number, yy: number) => h[((yy + size) % size) * size + ((xx + size) % size)];
      const dx = at(x + 1, y) - at(x - 1, y);
      const dy = at(x, y + 1) - at(x, y - 1);
      const i = (y * size + x) * 4;
      img.data[i] = 128 + dx * 22;
      img.data[i + 1] = 128 + dy * 22;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** Papel kraft del sobre, con la dirección en una ventana. */
export function drawKraft(p: Paper, withAddress: boolean) {
  const ctx = p.ctx;
  clear(p, '#d8c19b');
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(120,90,50,0.08)' : 'rgba(255,250,235,0.1)';
    ctx.fillRect(rnd() * p.w, rnd() * p.h, 1 + rnd() * 6, 1);
  }
  if (!withAddress) return;
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  roundRect(ctx, 30, 110, 200, 76, 4);
  ctx.fill();
  text(ctx, d.invoiceA.client, 44, 140, { w: 600, px: 15 });
  bars(ctx, 44, 152, 150, 2, 11);
  text(ctx, d.invoiceA.issuer, 30, 44, { w: 560, px: 12, c: '#6b5636' });
  // Sello de franqueo
  ctx.fillStyle = '#f7f3ea';
  roundRect(ctx, 262, 24, 54, 64, 3);
  ctx.fill();
  ctx.strokeStyle = C.green;
  ctx.lineWidth = 2;
  roundRect(ctx, 267, 29, 44, 54, 2);
  ctx.stroke();
  check(ctx, 289, 56, 11);
}

/** Canto de las hojas del libro (rayas finas). */
export function drawPageEdge(p: Paper) {
  const ctx = p.ctx;
  clear(p, '#f1ede1');
  for (let y = 0; y < p.h; y += 2) {
    ctx.fillStyle = y % 4 ? 'rgba(120,110,90,0.12)' : 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, y, p.w, 1);
  }
}

/** Tapa del libro mayor: título en pan de oro. */
export function drawLedgerCover(p: Paper) {
  const ctx = p.ctx;
  ctx.clearRect(0, 0, p.w, p.h);
  ctx.strokeStyle = '#c9a45c';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, p.w - 44, p.h - 44);
  text(ctx, 'LIBRO MAYOR', p.w / 2, p.h * 0.42, { w: 700, px: 22, c: '#d8b56a', align: 'center', st: 'expanded' });
  text(ctx, '2026', p.w / 2, p.h * 0.42 + 30, { w: 600, px: 14, c: '#d8b56a', align: 'center' });
}

/** Banderín de un hito de la hoja de ruta. */
export function drawFlag(p: Paper, when: string, title: string, current: boolean) {
  const ctx = p.ctx;
  clear(p, current ? '#1f6b4a' : '#ffffff');
  text(ctx, when, 18, 38, { w: 700, px: 22, c: current ? '#f5f6f3' : C.green, st: 'expanded' });
  text(ctx, title, 18, 66, { w: 560, px: 15, c: current ? '#d8ebe0' : C.ink });
}
