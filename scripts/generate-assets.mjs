// Genera public/og.png (1200×630), public/logo.png y public/apple-touch-icon.png.
// Uso: npm run assets   (requiere `npx playwright install chromium` una vez)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const font = (p) => readFileSync(fileURLToPath(new URL(`node_modules/${p}`, root))).toString('base64');
const archivo = font('@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2');

const symbol = (size) =>
  readFileSync(fileURLToPath(new URL('public/favicon.svg', root)), 'utf8').replace('<svg ', `<svg width="${size}" height="${size}" `);

const base = `
<style>
@font-face{font-family:A;src:url(data:font/woff2;base64,${archivo}) format('woff2-variations');font-weight:100 900;font-stretch:62% 125%}
*{margin:0;box-sizing:border-box} body{font-family:A;font-variant-numeric:tabular-nums}
.display{font-stretch:112%;font-weight:560;letter-spacing:-0.025em}
.stamp{display:inline-block;padding:10px 18px 12px;border:5px solid #1F6B4A;border-radius:10px;color:#1F6B4A;font-stretch:112%;font-weight:700;font-size:38px;letter-spacing:.06em;line-height:1;text-transform:uppercase;transform:rotate(-8deg)}
</style>`;

const og = `${base}
<div style="width:1200px;height:630px;background:#F5F6F3;position:relative;overflow:hidden;color:#14201B;padding:72px 80px;display:flex;flex-direction:column">
  <div style="display:flex;align-items:center;gap:16px">${symbol(52)}<span class="display" style="font-size:40px;font-weight:600">automatta</span></div>
  <div class="display" style="margin-top:auto;font-size:92px;line-height:.98;max-width:880px">Tu departamento financiero, en piloto automático.</div>
  <div style="margin-top:30px;font-size:26px;color:#5F6B65">Facturas, cobros, banco e impuestos para pymes de 1 a 70 empleados.</div>
  <div style="position:absolute;right:88px;top:96px"><span class="stamp">Cobrada</span></div>
</div>`;

const logo = `${base}<div style="width:512px;height:512px;display:grid;place-items:center;background:transparent">${symbol(512)}</div>`;
const apple = `${base}<div style="width:180px;height:180px;background:#1F6B4A;display:grid;place-items:center">${symbol(180)}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [html, w, h, out, transparent] of [
  [og, 1200, 630, 'public/og.png', false],
  [logo, 512, 512, 'public/logo.png', true],
  [apple, 180, 180, 'public/apple-touch-icon.png', false],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<body style="background:transparent">${html}</body>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL(out, root)), omitBackground: transparent });
  console.log('✓', out);
}
await browser.close();
