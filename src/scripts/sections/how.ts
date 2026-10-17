import { gsap } from 'gsap';

type Opts = { mobile: boolean };

export function initHow({ mobile }: Opts) {
  const scrubEnd = mobile ? 'center 45%' : 'center 40%';

  // 01 · Cobros: Vencida → Recordatorio enviado → Cobrada, con check dibujado.
  const cobros = document.querySelector<HTMLElement>('[data-cobros]');
  if (cobros) {
    const q = gsap.utils.selector(cobros);
    const nodes = q('.cb-dot');
    gsap.set(q('.cb-check-circle, .cb-check-mark'), { drawSVG: '0%' });
    gsap.set(q('.cb-progress'), { scaleX: 0 });
    gsap.set(nodes.slice(1), { scale: 0.7, opacity: 0.35 });
    gsap.set(q('.cb-mail'), { opacity: 0, x: -20 });

    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: { trigger: cobros, start: 'top 80%', end: scrubEnd, scrub: 0.6 },
      })
      .to(q('.cb-progress'), { scaleX: 0.5, duration: 1, ease: 'none' })
      .to(q('.cb-pill-0'), { opacity: 0, y: -8, duration: 0.3 }, 0.6)
      .fromTo(q('.cb-pill-1'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, 0.7)
      .to(nodes[1], { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 0.8)
      .to(q('.cb-mail'), { opacity: 1, x: 0, duration: 0.4 }, 0.8)
      .to(q('.cb-mail'), { x: 40, opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.5)
      .to(q('.cb-progress'), { scaleX: 1, duration: 1, ease: 'none' }, 1.2)
      .to(q('.cb-pill-1'), { opacity: 0, y: -8, duration: 0.3 }, 2)
      .fromTo(q('.cb-pill-2'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, 2.1)
      .to(nodes[2], { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 2.2)
      .to(q('.cb-check-circle'), { drawSVG: '100%', duration: 0.6 }, 2.2)
      .to(q('.cb-check-mark'), { drawSVG: '100%', duration: 0.4 }, 2.6);
  }

  // 02 · Conciliación: los movimientos del banco vuelan y encajan con su factura.
  const recon = document.querySelector<HTMLElement>('[data-recon]');
  if (recon) {
    const q = gsap.utils.selector(recon);
    const banks = q('.rc-bank');
    const order = [2, 0, 1]; // llegan desordenados
    const tl = gsap.timeline({
      scrollTrigger: { trigger: recon, start: 'top 80%', end: scrubEnd, scrub: 0.6 },
    });
    banks.forEach((b, i) => {
      const from = order[i] - i;
      tl.fromTo(
        b,
        { x: mobile ? -24 : -60, yPercent: from * 115, rotate: gsap.utils.random(-10, 10), opacity: 0 },
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

  // 03 · Previsión: el gráfico de 8 semanas se dibuja con el scroll.
  const forecast = document.querySelector<HTMLElement>('[data-forecast]');
  if (forecast) {
    const q = gsap.utils.selector(forecast);
    gsap
      .timeline({
        scrollTrigger: { trigger: forecast, start: 'top 80%', end: scrubEnd, scrub: 0.6 },
      })
      .from(q('.fc-bar'), {
        scaleY: 0,
        transformOrigin: '50% 100%',
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
      })
      .fromTo(q('.fc-line'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.4, ease: 'none' }, 0.1)
      .from(q('.fc-dot'), { scale: 0, transformOrigin: '50% 50%', stagger: 0.17, duration: 0.2 }, 0.15)
      .from(q('.fc-threshold'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6 }, 0.8)
      .from(q('.fc-zone'), { opacity: 0, duration: 0.4 }, 1.1)
      .from(q('.fc-alert'), { opacity: 0, y: 12, scale: 0.9, duration: 0.4, ease: 'back.out(2)' }, 1.3);
  }
}
