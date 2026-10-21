// Atlas de documentos: dibuja en un canvas todas las texturas del mundo 3D.
// Cada tipo de documento tiene dos versiones: "desordenada" (rojo, errores, a mano)
// y "en orden" (sello verde, cuadrado). El shader mezcla una con otra.
import es from '../../content/es';

import { ATLAS_COLS, KIND, KIND_COUNT, SHEET_RATIO } from './constants';
export { ATLAS_COLS, KIND, SHEET_RATIO };

const C = {
  ink: '#14201b',
  muted: '#5f6b65',
  faint: 'rgba(20,32,27,0.14)',
  line: 'rgba(20,32,27,0.12)',
  green: '#1f6b4a',
  greenSoft: '#d8ebe0',
  red: '#c8372d',
  redSoft: '#f5dbd8',
  paper: '#ffffff',
  paper2: '#f5f6f3',
  excel: '#1d6f42',
  yellow: '#f6e7a6',
};

// Tamaño lógico de una celda (se escala al dibujar).
const W = 340;
const H = Math.round(W * SHEET_RATIO);

const d = es.world;

type Ctx = CanvasRenderingContext2D;

function font(ctx: Ctx, weight: number, px: number, stretch: 'normal' | 'expanded' | 'condensed' = 'normal') {
  ctx.font = `${weight} ${px}px "Archivo Variable", "Archivo", system-ui, sans-serif`;
  const c = ctx as Ctx & { fontStretch?: string };
  if ('fontStretch' in c) c.fontStretch = stretch === 'expanded' ? 'semi-expanded' : stretch === 'condensed' ? 'semi-condensed' : 'normal';
}

function text(ctx: Ctx, s: string, x: number, y: number, o: { w?: number; px?: number; c?: string; align?: CanvasTextAlign; st?: 'normal' | 'expanded' | 'condensed' } = {}) {
  font(ctx, o.w ?? 450, o.px ?? 12, o.st ?? 'normal');
  ctx.fillStyle = o.c ?? C.ink;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

/** Líneas grises que hacen de "texto pequeño" ilegible a distancia. */
function bars(ctx: Ctx, x: number, y: number, w: number, n: number, gap = 11, c = C.faint) {
  ctx.fillStyle = c;
  for (let i = 0; i < n; i++) {
    const ww = w * (0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898 + x)));
    roundRect(ctx, x, y + i * gap, ww, 4, 2);
    ctx.fill();
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hr(ctx: Ctx, x: number, y: number, w: number, c = C.line) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, 1.2);
}

function check(ctx: Ctx, cx: number, cy: number, r: number, bg = C.green, fg = '#fff') {
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = fg;
  ctx.lineWidth = r * 0.32;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.02);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.38);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.32);
  ctx.stroke();
}

/** Sello de caucho con grano: se dibuja aparte y se "estampa" girado. */
function stamp(ctx: Ctx, label: string, color: string, cx: number, cy: number, rot: number, px = 26, sub?: string) {
  const tmp = document.createElement('canvas');
  const s = 2;
  font(tmp.getContext('2d')!, 700, px, 'expanded');
  const tctx = tmp.getContext('2d')!;
  font(tctx, 700, px, 'expanded');
  const tw = tctx.measureText(label.toUpperCase()).width;
  const bw = tw + px * 1.1;
  const bh = px * (sub ? 2.05 : 1.5);
  tmp.width = Math.ceil(bw * s);
  tmp.height = Math.ceil(bh * s);
  const t = tmp.getContext('2d')!;
  t.scale(s, s);
  t.strokeStyle = color;
  t.lineWidth = px * 0.13;
  roundRect(t, px * 0.08, px * 0.08, bw - px * 0.16, bh - px * 0.16, px * 0.22);
  t.stroke();
  font(t, 700, px, 'expanded');
  t.fillStyle = color;
  t.textAlign = 'center';
  t.textBaseline = 'middle';
  t.fillText(label.toUpperCase(), bw / 2, sub ? bh * 0.4 : bh / 2 + px * 0.04);
  if (sub) {
    font(t, 600, px * 0.42, 'normal');
    t.fillText(sub.toUpperCase(), bw / 2, bh * 0.76);
  }
  // Grano: se quitan motas de tinta al azar.
  t.globalCompositeOperation = 'destination-out';
  let seed = label.length * 97;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 520; i++) {
    t.globalAlpha = 0.25 + rnd() * 0.75;
    t.beginPath();
    t.arc(rnd() * bw, rnd() * bh, rnd() * 1.4 + 0.2, 0, Math.PI * 2);
    t.fill();
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = 0.92;
  ctx.drawImage(tmp, -bw / 2, -bh / 2, bw, bh);
  ctx.restore();
}

/** Nota adhesiva amarilla con texto "a mano". */
function sticky(ctx: Ctx, label: string, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(20,32,27,0.12)';
  ctx.fillRect(3, 4, 118, 64);
  ctx.fillStyle = C.yellow;
  ctx.fillRect(0, 0, 118, 64);
  text(ctx, label, 10, 38, { w: 560, px: 15, c: '#5a4a10' });
  ctx.restore();
}

function paper(ctx: Ctx) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
}

type InvoiceDoc = { kind: string; number: string; issuer: string; client: string; concept: string; base: string; vat: string; total: string; due: string; note?: string };

function invoice(ctx: Ctx, clean: boolean, v: InvoiceDoc) {
  paper(ctx);
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
  bars(ctx, m, 372, W - m * 2, 3, 12);
  if (clean) {
    stamp(ctx, d.stamps.paid, C.green, W * 0.62, 418, -0.16, 28, '19 oct');
  } else {
    text(ctx, v.due, m, 438, { w: 560, px: 13, c: C.red });
    stamp(ctx, d.stamps.overdue, C.red, W * 0.66, 424, -0.12, 26);
    if (v.note) {
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(W - m - 50, 326, 66, 22, -0.05, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, v.note, m, 466, { w: 560, px: 15, c: C.red });
    }
  }
}

function reminder(ctx: Ctx, clean: boolean) {
  const v = d.reminder;
  paper(ctx);
  ctx.fillStyle = C.paper2;
  ctx.fillRect(0, 0, W, 40);
  ['#d9dcd8', '#d9dcd8', '#d9dcd8'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(20 + i * 16, 20, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  const m = 26;
  text(ctx, v.from, m, 72, { px: 12, c: C.muted });
  text(ctx, v.to, m, 92, { px: 12, c: C.muted });
  hr(ctx, m, 106, W - m * 2);
  text(ctx, v.subject, m, 138, { w: 620, px: 17 });
  bars(ctx, m, 160, W - m * 2, 9, 14);
  bars(ctx, m, 300, W * 0.5, 3, 14);
  if (clean) {
    ctx.fillStyle = C.greenSoft;
    roundRect(ctx, m, 380, 200, 30, 15);
    ctx.fill();
    check(ctx, m + 16, 395, 9);
    text(ctx, v.auto, m + 32, 400, { w: 560, px: 13, c: C.green });
  } else {
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(W - m - 6, 132, 6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, v.manual, m, 400, { px: 13, c: C.red });
    stamp(ctx, '3.er aviso', C.red, W * 0.66, 440, 0.1, 20);
  }
}

function sheet(ctx: Ctx, clean: boolean) {
  const v = d.sheet;
  paper(ctx);
  const m = 14;
  const rows = 13;
  const top = 58;
  const rh = 29;
  const cw = [70, 84, 70, 84];
  if (clean) {
    text(ctx, v.ledger, 22, 40, { w: 640, px: 18, st: 'expanded' });
    hr(ctx, 22, 50, W - 44, 'rgba(20,32,27,0.3)');
  } else {
    ctx.fillStyle = C.excel;
    ctx.fillRect(0, 0, W, 34);
    text(ctx, v.file, 14, 22, { w: 560, px: 12, c: '#fff' });
  }
  let x = m;
  v.cols.forEach((c, i) => {
    text(ctx, c, x + 6, top + 18, { w: 560, px: 11, c: C.muted });
    x += cw[i];
  });
  for (let r = 0; r < rows; r++) {
    const y = top + rh * (r + 1);
    hr(ctx, m, y, W - m * 2);
    const id = `F-20${41 - r}`;
    const amount = ['4.000', '860', '2.420', '395', '1.150', '640', '6.000', '2.500', '780', '1.900', '310', '3.000', '520'][r];
    text(ctx, id, m + 6, y + 19, { px: 11, st: 'condensed' });
    text(ctx, amount, m + cw[0] + cw[1] - 8, y + 19, { px: 11, align: 'right', st: 'condensed' });
    const bad = !clean && [0, 1, 3, 4, 6, 8, 9, 11].includes(r);
    if (bad) {
      ctx.fillStyle = C.redSoft;
      ctx.fillRect(m + cw[0] + cw[1] + 1, y + 2, cw[2] - 2, rh - 3);
      text(ctx, r % 3 === 1 ? '¿?' : '#N/A', m + cw[0] + cw[1] + cw[2] / 2, y + 19, { w: 640, px: 11, c: C.red, align: 'center' });
    } else {
      text(ctx, Math.round(Number(amount.replace('.', '')) * 0.21).toLocaleString('es-ES'), m + cw[0] + cw[1] + cw[2] / 2, y + 19, { px: 11, align: 'center', st: 'condensed', c: C.muted });
    }
    if (clean) check(ctx, W - m - 40, y + 14, 7);
    else if (r % 4 === 2) {
      ctx.fillStyle = C.yellow;
      ctx.fillRect(m + cw[0] + cw[1] + cw[2] + 1, y + 2, cw[3] - 2, rh - 3);
    }
  }
  // Rejilla vertical
  x = m;
  ctx.fillStyle = C.line;
  for (const w of cw) {
    ctx.fillRect(x, top, 1, rh * (rows + 1));
    x += w;
  }
}

function bank(ctx: Ctx, clean: boolean) {
  const v = d.bank;
  paper(ctx);
  const m = 24;
  ctx.fillStyle = C.ink;
  ctx.fillRect(0, 0, W, 64);
  text(ctx, v.title, m, 32, { w: 640, px: 17, c: '#f5f6f3', st: 'expanded' });
  text(ctx, v.account, m, 52, { px: 12, c: '#9aa8a1' });
  v.rows.forEach(([label, amount], i) => {
    const y = 100 + i * 66;
    text(ctx, label, m, y, { w: 520, px: 13 });
    bars(ctx, m, y + 10, 110, 1);
    const positive = amount.startsWith('+');
    text(ctx, amount, W - m - (clean ? 30 : 0), y, { w: 620, px: 14, align: 'right', c: positive ? C.green : C.ink, st: 'condensed' });
    if (clean) check(ctx, W - m - 9, y - 5, 9);
    else if (positive) text(ctx, '?', W - m - 4, y + 22, { w: 700, px: 16, c: C.red, align: 'right' });
    hr(ctx, m, y + 28, W - m * 2);
  })
  if (clean) stamp(ctx, d.stamps.matched, C.green, W * 0.6, 444, -0.1, 24);
}

function supplier(ctx: Ctx, clean: boolean) {
  const v = d.supplier;
  paper(ctx);
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
    if (clean) {
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
  if (clean) stamp(ctx, d.stamps.approved, C.green, W * 0.64, 452, -0.14, 26);
  else sticky(ctx, v.note, W - 150, 360, 0.08);
}

function ticket(ctx: Ctx, clean: boolean) {
  const v = d.ticket;
  ctx.clearRect(0, 0, W, H);
  const tw = 176;
  const x0 = (W - tw) / 2;
  const y0 = 30;
  const th = H - 80;
  // Silueta con bordes en zigzag
  ctx.fillStyle = C.paper;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  const teeth = 11;
  for (let i = 0; i <= teeth; i++) ctx.lineTo(x0 + (tw / teeth) * i, y0 + (i % 2 ? 6 : 0));
  ctx.lineTo(x0 + tw, y0 + th);
  for (let i = teeth; i >= 0; i--) ctx.lineTo(x0 + (tw / teeth) * i, y0 + th - (i % 2 ? 6 : 0));
  ctx.closePath();
  ctx.fill();
  const cx = W / 2;
  text(ctx, v.shop, cx, y0 + 46, { w: 640, px: 15, align: 'center', st: 'condensed' });
  bars(ctx, x0 + 26, y0 + 62, tw - 52, 3, 10);
  hr(ctx, x0 + 16, y0 + 110, tw - 32, 'rgba(20,32,27,0.25)');
  v.lines.forEach((l, i) => {
    text(ctx, l, x0 + 18, y0 + 140 + i * 24, { px: 12, st: 'condensed' });
    bars(ctx, x0 + tw - 64, y0 + 132 + i * 24, 46, 1);
  });
  hr(ctx, x0 + 16, y0 + 196, tw - 32, 'rgba(20,32,27,0.25)');
  text(ctx, 'TOTAL', x0 + 18, y0 + 226, { w: 640, px: 13 });
  text(ctx, v.total, x0 + tw - 18, y0 + 226, { w: 640, px: 15, align: 'right', st: 'condensed' });
  bars(ctx, x0 + 22, y0 + 252, tw - 44, 6, 10);
  if (clean) {
    check(ctx, cx, y0 + 344, 16);
    text(ctx, v.registered, cx, y0 + 380, { w: 600, px: 13, c: C.green, align: 'center' });
  } else {
    // Arrugas: trazos diagonales tenues
    ctx.strokeStyle = 'rgba(20,32,27,0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x0, y0 + 60 + i * 70);
      ctx.lineTo(x0 + tw, y0 + 90 + i * 64);
      ctx.stroke();
    }
  }
}

function tax(ctx: Ctx, clean: boolean) {
  const v = d.tax;
  paper(ctx);
  const m = 24;
  text(ctx, v.title, m, 50, { w: 680, px: 28, st: 'expanded' });
  text(ctx, v.subtitle, m, 72, { px: 13, c: C.muted });
  hr(ctx, m, 88, W - m * 2, 'rgba(20,32,27,0.3)');
  bars(ctx, m, 104, W - m * 2, 3, 12);
  v.boxes.forEach(([label, value], i) => {
    const y = 170 + i * 72;
    text(ctx, `${String(i + 1).padStart(2, '0')}  ${label}`, m, y, { px: 12, c: C.muted });
    ctx.strokeStyle = 'rgba(20,32,27,0.35)';
    ctx.lineWidth = 1.2;
    roundRect(ctx, m, y + 10, W - m * 2, 34, 4);
    ctx.stroke();
    if (clean) {
      if (i === 2) {
        ctx.fillStyle = C.ink;
        roundRect(ctx, m, y + 10, W - m * 2, 34, 4);
        ctx.fill();
      }
      text(ctx, value, W - m - 12, y + 33, { w: 620, px: 16, align: 'right', c: i === 2 ? '#f5f6f3' : C.ink, st: 'condensed' });
    }
  });
  if (clean) stamp(ctx, d.stamps.draft, C.green, W * 0.58, 440, -0.1, 22);
  else text(ctx, v.deadline, m, 430, { w: 640, px: 16, c: C.red });
}

function survey(ctx: Ctx) {
  const v = es.survey;
  paper(ctx);
  const m = 26;
  text(ctx, v.docTitle, m, 50, { w: 600, px: 16 });
  hr(ctx, m, 66, W - m * 2);
  v.bullets.forEach((b, i) => {
    const y = 100 + i * 80;
    ctx.fillStyle = C.green;
    roundRect(ctx, m, y - 14, 18, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(m + 4.5, y - 5);
    ctx.lineTo(m + 8, y - 1.5);
    ctx.lineTo(m + 14, y - 9);
    ctx.stroke();
    text(ctx, b.title, m + 30, y, { w: 600, px: 15 });
    bars(ctx, m + 30, y + 14, W - m * 2 - 40, 2, 11);
    if (i < v.bullets.length - 1) hr(ctx, m, y + 46, W - m * 2);
  });
}

function drawCell(ctx: Ctx, kind: number, clean: boolean) {
  switch (kind) {
    case KIND.invoiceA:
      return invoice(ctx, clean, d.invoiceA);
    case KIND.invoiceB:
      return invoice(ctx, clean, d.invoiceB);
    case KIND.reminder:
      return reminder(ctx, clean);
    case KIND.sheet:
      return sheet(ctx, clean);
    case KIND.bank:
      return bank(ctx, clean);
    case KIND.supplier:
      return supplier(ctx, clean);
    case KIND.ticket:
      return ticket(ctx, clean);
    case KIND.tax:
      return tax(ctx, clean);
    case KIND.survey:
      return survey(ctx);
  }
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * Dibuja el atlas celda a celda (una por fotograma) para no bloquear el hilo principal.
 * `size` es el lado del canvas (2048 en escritorio, 1024 en móvil).
 */
export async function buildAtlas(size: number) {
  try {
    await document.fonts.load('600 16px "Archivo Variable"');
  } catch {
    /* sin fuente: se usa la del sistema */
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cellW = size / ATLAS_COLS;
  const scale = cellW / W;
  for (let kind = 0; kind < KIND_COUNT; kind++) {
    for (let clean = 0; clean < 2; clean++) {
      const cell = kind * 2 + clean;
      const cx = (cell % ATLAS_COLS) * cellW;
      const cy = Math.floor(cell / ATLAS_COLS) * cellW * SHEET_RATIO;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      drawCell(ctx, kind, clean === 1);
      ctx.restore();
    }
    await nextFrame();
  }
  return { canvas, cellW: cellW / size, cellH: (cellW * SHEET_RATIO) / size };
}
