import { gsap } from 'gsap';

type Opts = { mobile: boolean };

const formatEuro = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

export function initHow({ mobile }: Opts) {
  const scrubEnd = mobile ? 'center 45%' : 'center 40%';
  const scrubbed = (trigger: Element) =>
    gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger, start: 'top 80%', end: scrubEnd, scrub: 0.6 },
    });

  // 01 · Proveedores: el PDF se escanea, los campos se rellenan y se aprueba desde el móvil.
  const payables = document.querySelector<HTMLElement>('[data-payables]');
  if (payables) {
    const q = gsap.utils.selector(payables);
    scrubbed(payables)
      .from(q('.pp-pdf'), { y: -40, rotate: -8, opacity: 0, duration: 0.5 })
      .fromTo(q('.pp-scan'), { yPercent: -100 }, { yPercent: 450, duration: 0.9, ease: 'none' }, 0.4)
      .from(q('.pp-field'), { x: 24, opacity: 0, stagger: 0.18, duration: 0.3 }, 0.5)
      .from(q('.pp-check'), { scale: 0, opacity: 0, stagger: 0.15, duration: 0.3, ease: 'back.out(2)' }, 1.3)
      .from(q('.pp-phone'), { y: 30, opacity: 0, duration: 0.4 }, 1.5)
      .fromTo(q('.pp-tap'), { scale: 0.4, opacity: 0 }, { scale: 1.3, opacity: 1, duration: 0.25 }, 1.9)
      .to(q('.pp-tap'), { opacity: 0, duration: 0.2 }, 2.15)
      .to(q('.pp-approve'), { opacity: 0, duration: 0.15 }, 2.1)
      .fromTo(q('.pp-approved'), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, 2.1)
      .from(q('.pp-transfer'), { y: 10, opacity: 0, duration: 0.3 }, 2.3);
  }

  // 02 · Cobros: escalada día 3 → 20 → 40 y, al final, cobrada con check dibujado.
  const cobros = document.querySelector<HTMLElement>('[data-cobros]');
  if (cobros) {
    const q = gsap.utils.selector(cobros);
    const nodes = q('.cb-node');
    const pills = q('.cb-pill');
    gsap.set(q('.cb-check-circle, .cb-check-mark'), { drawSVG: '0%' });
    gsap.set(q('.cb-progress'), { scaleX: 0 });
    // Solo se atenúa el círculo: el texto de cada paso siempre se lee bien.
    const dots = nodes.map((n) => n.querySelector('.cb-dot')!);
    gsap.set(dots, { opacity: 0.35 });
    gsap.set(q('.cb-mail'), { opacity: 0, x: -20 });

    const tl = scrubbed(cobros);
    const swap = (from: number, to: number, at: number) =>
      tl
        .to(pills[from], { opacity: 0, y: -8, duration: 0.25 }, at)
        .fromTo(pills[to], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, at + 0.1);
    dots.forEach((_, i) => {
      const at = i * 0.9;
      tl.to(dots[i], { opacity: 1, duration: 0.2 }, at).from(dots[i], { scale: 0.6, duration: 0.3, ease: 'back.out(2)' }, at);
      if (i < 2) {
        swap(i, i + 1, at + 0.1);
        tl.fromTo(q('.cb-mail'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3 }, at + 0.15).to(
          q('.cb-mail'),
          { opacity: 0, x: 40, duration: 0.3, ease: 'power2.in' },
          at + 0.6,
        );
      }
      if (i < nodes.length - 1) tl.to(q('.cb-progress'), { scaleX: (i + 1) / 2, duration: 0.7, ease: 'none' }, at + 0.2);
    });
    swap(2, 3, 2.9);
    tl.to(q('.cb-check-circle'), { drawSVG: '100%', duration: 0.5 }, 3).to(
      q('.cb-check-mark'),
      { drawSVG: '100%', duration: 0.35 },
      3.35,
    );
  }

  // 03 · Tesorería: los movimientos del banco encajan con su factura…
  const recon = document.querySelector<HTMLElement>('[data-recon]');
  if (recon) {
    const q = gsap.utils.selector(recon);
    const banks = q('.rc-bank');
    const order = [2, 0, 1]; // llegan desordenados
    const tl = scrubbed(recon);
    banks.forEach((b, i) => {
      tl.fromTo(
        b,
        { x: mobile ? -24 : -60, yPercent: (order[i] - i) * 115, rotate: gsap.utils.random(-10, 10), opacity: 0 },
        { x: 0, yPercent: 0, rotate: 0, opacity: 1, duration: 1, ease: 'power3.out' },
        i * 0.35,
      );
    });
    tl.fromTo(q('.rc-link'), { scaleX: 0 }, { scaleX: 1, duration: 0.4, stagger: 0.2 }, 1.2)
      .fromTo(
        q('.rc-check'),
        { scale: 0, rotate: -90 },
        { scale: 1, rotate: 0, duration: 0.4, stagger: 0.2, ease: 'back.out(2.5)' },
        1.35,
      )
      .fromTo(
        q('.rc-invoice'),
        { borderColor: 'rgba(11,16,32,0.08)' },
        { borderColor: 'rgba(43,214,123,0.8)', duration: 0.3, stagger: 0.2 },
        1.35,
      )
      .fromTo(q('.rc-done'), { opacity: 0, y: 12, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.4 }, 2.1);
  }

  // …y la previsión a 90 días se dibuja con el scroll.
  const forecast = document.querySelector<HTMLElement>('[data-forecast]');
  if (forecast) {
    const q = gsap.utils.selector(forecast);
    scrubbed(forecast)
      .from(q('.fc-bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.4, stagger: 0.08 })
      .fromTo(q('.fc-line'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'none' }, 0.1)
      .from(q('.fc-dot'), { scale: 0, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.2 }, 0.15)
      .from(q('.fc-threshold'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6 }, 0.8)
      .from(q('.fc-zone'), { opacity: 0, duration: 0.4 }, 1.1)
      .from(q('.fc-alert'), { opacity: 0, y: 12, scale: 0.9, duration: 0.4, ease: 'back.out(2)' }, 1.3);
  }

  // 04 · Cierre: los indicadores cuentan, las barras crecen y los apuntes aparecen solos.
  const close = document.querySelector<HTMLElement>('[data-month-close]');
  if (close) {
    const q = gsap.utils.selector(close);
    const tl = scrubbed(close);
    q('.cl-value').forEach((el, i) => {
      const target = Number((el as HTMLElement).dataset.value!.replace(/\D/g, ''));
      const counter = { n: 0 };
      tl.to(
        counter,
        { n: target, duration: 1, ease: 'power1.out', onUpdate: () => (el.textContent = formatEuro(counter.n)) },
        i * 0.15,
      );
    });
    tl.from(q('.cl-bar'), { scaleY: 0, transformOrigin: '50% 100%', stagger: 0.1, duration: 0.4 }, 0.2)
      .from(q('.cl-entry'), { x: -16, opacity: 0, stagger: 0.2, duration: 0.3 }, 0.9)
      .from(q('.cl-link'), { scale: 0.8, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, 1.6);
    gsap.fromTo(q('.cl-live'), { scale: 1, opacity: 0.8 }, { scale: 2.4, opacity: 0, duration: 1.4, repeat: -1 });
  }

  // 05 · Impuestos: foto al ticket, gasto registrado y borrador del 303 listo.
  const taxes = document.querySelector<HTMLElement>('[data-taxes]');
  if (taxes) {
    const q = gsap.utils.selector(taxes);
    scrubbed(taxes)
      .from(q('.tx-ticket'), { y: 30, rotate: 6, opacity: 0, duration: 0.5 })
      .fromTo(q('.tx-flash'), { opacity: 0 }, { opacity: 0.9, duration: 0.1 }, 0.6)
      .to(q('.tx-flash'), { opacity: 0, duration: 0.3 }, 0.7)
      .from(q('.tx-registered'), { scale: 0.6, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, 0.8)
      .from(q('.tx-form'), { x: 30, opacity: 0, duration: 0.5 }, 1)
      .from(q('.tx-row'), { y: 10, opacity: 0, stagger: 0.15, duration: 0.3 }, 1.2)
      .from(q('.tx-draft'), { scale: 0, duration: 0.3, ease: 'back.out(2)' }, 1.7)
      .from(q('.tx-cta'), { y: 10, opacity: 0, duration: 0.3 }, 1.9);
  }
}

/** Hoja de ruta: la línea se dibuja con el scroll y cada hito se enciende al alcanzarlo. */
export function initRoadmap() {
  const list = document.querySelector<HTMLElement>('[data-roadmap]');
  if (!list) return;
  const q = gsap.utils.selector(list);
  gsap.fromTo(
    q('.rm-line'),
    { scaleY: 0 },
    { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 60%', scrub: 0.5 } },
  );
  q('.rm-item').forEach((item) => {
    gsap.from(item, {
      x: -16,
      opacity: 0,
      duration: 0.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: item, start: 'top 75%', once: true },
    });
  });
}
