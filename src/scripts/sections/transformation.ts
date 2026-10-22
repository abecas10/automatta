import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Opts = { mobile: boolean };

/** Posición de un elemento dentro de un ancestro, ignorando transforms. */
function offsetIn(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}

const visible = (el: HTMLElement) => el.offsetParent !== null;
const formatEuro = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`;

export function initTransformation({ mobile }: Opts) {
  const section = document.querySelector<HTMLElement>('[data-transform]');
  if (!section) return;
  const stage = section.querySelector<HTMLElement>('[data-tf-stage]')!;
  const dash = section.querySelector<HTMLElement>('[data-tf-dash]')!;
  const mails = [...section.querySelectorAll<HTMLElement>('[data-tf-mail]')].filter(visible);
  const cells = [...section.querySelectorAll<HTMLElement>('[data-tf-cell]')].filter(visible);
  const rows = [...section.querySelectorAll<HTMLElement>('[data-tf-row]')].filter(visible);
  const kpis = [...section.querySelectorAll<HTMLElement>('[data-tf-kpi]')];
  const steps = [...section.querySelectorAll<HTMLElement>('.tf-step')];
  const line = section.querySelector<SVGPathElement>('.tf-line')!;
  const area = section.querySelector<SVGPathElement>('.tf-area')!;

  // En móvil, si el panel no cabe en la pantalla mientras está fijado, se escala el escenario.
  const pin = section.querySelector<HTMLElement>('.tf-pin')!;
  const fit = () => {
    if (!mobile) return;
    const top = offsetIn(stage, pin).y - stage.offsetHeight / 2;
    const available = window.innerHeight - top - 12;
    gsap.set(stage, { scale: Math.min(1, available / stage.offsetHeight), transformOrigin: '50% 0%' });
  };
  fit();
  ScrollTrigger.addEventListener('refreshInit', fit);

  const delta = (from: HTMLElement, to: HTMLElement) => {
    const a = offsetIn(from, stage);
    const b = offsetIn(to, stage);
    return { x: b.x - a.x, y: b.y - a.y };
  };

  const setStep = (active: number) =>
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === active);
      s.classList.toggle('is-done', i < active);
    });

  // Estado inicial
  gsap.set(dash, { opacity: 0.12, scale: 0.94, filter: mobile ? 'none' : 'blur(6px)' });
  gsap.set(rows, { opacity: 0 });
  gsap.set(kpis.map((k) => k.querySelector('[data-value]')), { opacity: 0 });
  gsap.set(line, { drawSVG: '0%' });
  gsap.set(area, { opacity: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: mobile ? '+=190%' : '+=260%',
      pin,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (self) => setStep(Math.min(2, Math.floor(self.progress * 3.2))),
      onLeaveBack: () => setStep(-1),
    },
  });

  // 0. El caos se agita un poco antes de ordenarse
  tl.to([...mails, ...cells], {
    x: () => gsap.utils.random(-14, 14),
    y: () => gsap.utils.random(-10, 10),
    duration: 0.4,
    stagger: 0.02,
    ease: 'sine.inOut',
  });

  // 1. Los emails vuelan a su fila de factura: los recordatorios salen solos
  tl.to(dash, { opacity: 1, scale: 1, filter: mobile ? 'none' : 'blur(0px)', duration: 0.6 }, '>-0.1');
  mails.forEach((m, i) => {
    const target = rows[i % rows.length];
    tl.to(
      m,
      {
        x: () => delta(m, target).x,
        y: () => delta(m, target).y,
        rotate: 0,
        scale: 0.6,
        duration: 0.8,
      },
      0.55 + i * 0.07,
    ).to(m, { opacity: 0, duration: 0.2 }, '>-0.15');
  });
  tl.to(rows, { opacity: 1, duration: 0.3, stagger: 0.1 }, 1.15);
  tl.from(
    rows.map((r) => r.querySelector('.tf-pill')),
    { scale: 0.4, opacity: 0, duration: 0.3, stagger: 0.1, ease: 'back.out(2)' },
    1.25,
  );

  // 2. Las celdas rojas encajan en los indicadores: cada cobro con su factura
  cells.forEach((c, i) => {
    const target = kpis[i % kpis.length];
    tl.to(
      c,
      {
        x: () => delta(c, target).x,
        y: () => delta(c, target).y,
        rotate: 0,
        scale: 0.5,
        backgroundColor: '#2BD67B',
        borderColor: '#2BD67B',
        color: '#0B1020',
        duration: 0.8,
      },
      1.9 + i * 0.07,
    ).to(c, { opacity: 0, duration: 0.2 }, '>-0.15');
  });
  kpis.forEach((k, i) => {
    const valueEl = k.querySelector<HTMLElement>('[data-value]')!;
    const target = Number(valueEl.dataset.value!.replace(/\D/g, ''));
    const counter = { n: 0 };
    tl.to(valueEl, { opacity: 1, duration: 0.2 }, 2.5 + i * 0.12).to(
      counter,
      {
        n: target,
        duration: 0.6,
        ease: 'power1.out',
        onUpdate: () => (valueEl.textContent = formatEuro(counter.n)),
      },
      2.5 + i * 0.12,
    );
    tl.fromTo(
      k,
      { borderColor: 'rgba(255,255,255,0.08)' },
      { borderColor: 'rgba(43,214,123,0.5)', duration: 0.3, yoyo: true, repeat: 1 },
      2.5 + i * 0.12,
    );
  });

  // 3. La previsión de caja se dibuja
  tl.to(line, { drawSVG: '100%', duration: 1, ease: 'power1.inOut' }, 3.4).to(area, { opacity: 1, duration: 0.6 }, 3.8);
  tl.to({}, { duration: 0.4 });
}
