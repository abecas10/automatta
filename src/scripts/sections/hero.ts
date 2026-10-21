import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { cleanText } from '../reveal';
import { pressStamp } from '../stamp';

type Opts = { mobile: boolean };

/** Secuencia de carga: el titular sube, la factura llega, se cobra, se concilia y la caja se actualiza. */
export function initHero({ mobile }: Opts, withWorld = false) {
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  if (!title) return;

  const label = cleanText(title);
  SplitText.create(title, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) => {
      title.setAttribute('aria-label', label);
      gsap.set(title, { visibility: 'visible' });
      return gsap.from(self.lines, { yPercent: 100, duration: 1.1, stagger: 0.1, ease: 'expo.out' });
    },
  });
  gsap.fromTo('[data-hero-in]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, delay: 0.3, ease: 'expo.out' });
  gsap.from('[data-hero-sub]', { y: 12, duration: 0.9, ease: 'expo.out', delay: 0.25 });

  // Con el mundo 3D, la nube de papeles ocupa el sitio del escritorio.
  if (!withWorld) deskSequence();

  if (!mobile && !withWorld) {
    gsap.to('[data-desk]', {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: title.closest('section'), start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

function deskSequence() {
  const desk = document.querySelector<HTMLElement>('[data-desk]');
  if (!desk) return;
  const q = gsap.utils.selector(desk);
  const invoice = q('[data-desk-invoice]');
  const bank = q('[data-desk-bank]');
  const forecast = q('[data-desk-forecast]');
  const rows = q<HTMLElement>('[data-match]');
  const line = desk.querySelector<SVGPathElement>('.desk-line');

  gsap.set(invoice, { y: 40, opacity: 0, rotate: -2.5, transformOrigin: '50% 100%' });
  gsap.set(bank, { x: 40, opacity: 0 });
  gsap.set(forecast, { y: 30, opacity: 0 });
  if (line) gsap.set(line, { drawSVG: '0%' });

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.45 });
  tl.to(invoice, { y: 0, opacity: 1, rotate: 0, duration: 1.1 })
    .to(bank, { x: 0, opacity: 1, duration: 1 }, 0.45)
    // El banco encuentra el cobro de la factura…
    .add(() => rows[0]?.classList.add('is-matched'), 1.25)
    .to(q('[data-desk-overdue]'), { opacity: 0, duration: 0.2 }, 1.4);
  // …y se estampa COBRADA.
  pressStamp(tl, q('.desk-stamp')[0], 1.45);
  tl.to(q('[data-desk-matched]'), { opacity: 1, duration: 0.5 }, 1.9)
    .add(() => rows[1]?.classList.add('is-matched'), 2.1)
    // La previsión de caja se actualiza.
    .to(forecast, { y: 0, opacity: 1, duration: 1 }, 2.0);
  if (line) tl.to(line, { drawSVG: '100%', duration: 1.3, ease: 'power2.inOut' }, 2.25);
  tl.to(q('.desk-dot, .desk-dot-pulse'), { opacity: 1, duration: 0.3 }, 3.3).fromTo(
    q('[data-desk-toast]'),
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.7 },
    3.4,
  );
}
