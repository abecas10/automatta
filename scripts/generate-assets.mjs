// Genera public/og.png (1200×630), public/logo.png y public/apple-touch-icon.png.
// Uso: npm run assets   (requiere `npx playwright install chromium` una vez)
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const font = (p) => readFileSync(fileURLToPath(new URL(`node_modules/${p}`, root))).toString('base64');
const bricolage = font('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2');
const inter = font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');

const symbol = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#6C5CE7"/><stop offset="1" stop-color="#2BD67B"/></linearGradient></defs>
  ${readFileSync(fileURLToPath(new URL('public/favicon.svg', root)), 'utf8').match(/<rect[\s\S]*<\/svg>/)[0].replace('</svg>', '')}
</svg>`;

const base = `
<style>
@font-face{font-family:B;src:url(data:font/woff2;base64,${bricolage}) format('woff2');font-weight:200 800}
@font-face{font-family:I;src:url(data:font/woff2;base64,${inter}) format('woff2');font-weight:100 900}
*{margin:0;box-sizing:border-box} body{font-family:I}
</style>`;

const og = `${base}
<div style="width:1200px;height:630px;background:#0B1020;position:relative;overflow:hidden;color:#F7F7F2;padding:72px 80px;display:flex;flex-direction:column">
  <div style="position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(108,92,231,.55),transparent 65%);left:-300px;top:-200px;filter:blur(40px)"></div>
  <div style="position:absolute;width:800px;height:800px;border-radius:50%;background:radial-gradient(circle,rgba(43,214,123,.4),transparent 65%);right:-250px;bottom:-400px;filter:blur(40px)"></div>
  <div style="position:relative;display:flex;align-items:center;gap:18px">${symbol(56)}<span style="font-family:B;font-weight:700;font-size:44px;letter-spacing:-1.5px">automatta</span></div>
  <div style="position:relative;margin-top:auto;font-family:B;font-weight:800;font-size:104px;line-height:.95;letter-spacing:-4px">Cobra antes.<br>Sabe tu caja.<br><span style="color:#2BD67B">Sin Excel.</span></div>
  <div style="position:relative;margin-top:36px;font-size:26px;color:rgba(247,247,242,.7)">Cobros y tesorería automáticos para pymes · Barcelona</div>
  <svg style="position:absolute;right:80px;top:150px" width="420" height="260" viewBox="0 0 420 260">
    <path d="M10 230 C 60 215, 90 220, 130 200 S 200 185, 240 160 S 320 130, 410 40" fill="none" stroke="#2BD67B" stroke-width="8" stroke-linecap="round" opacity=".9"/>
    <circle cx="410" cy="40" r="14" fill="#2BD67B"/>
  </svg>
</div>`;

const logo = `${base}<div style="width:512px;height:512px;display:grid;place-items:center;background:transparent">${symbol(512)}</div>`;
const apple = `${base}<div style="width:180px;height:180px;background:#0B1020;display:grid;place-items:center">${symbol(140)}</div>`;

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
